"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { normalizePkPhone, formatPkPhone } from "@/lib/supabase/phone";
import styles from "./edit-car.module.css";

type CarImage = {
  id: number;
  image_url: string;
  signedUrl: string;
};

export default function EditCarPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();

  const carId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [car, setCar] = useState<any>(null);

  // Phone number lives on the seller's profile (one number for all listings).
  // undefined = not loaded, null = none saved, string = saved
  const [profilePhone, setProfilePhone] = useState<
    string | null | undefined
  >(undefined);

  const [existingImages, setExistingImages] = useState<CarImage[]>(
    []
  );

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Load car
  useEffect(() => {
    async function loadCar() {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: carData, error: carError } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .eq("user_id", user.id)
        .single();

      if (carError || !carData) {
        setError("Car not found.");
        setLoading(false);
        return;
      }

      setCar(carData);

      // Load the seller's saved phone number
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();

      // If this fails we leave profilePhone undefined, so saving the
      // form will not touch the saved number.
      if (!profileError) {
        setProfilePhone(profile?.phone ?? null);
      }

      // Get existing images
      const { data: images } = await supabase
        .from("car_images")
        .select("id, image_url")
        .eq("car_id", carId)
        .order("created_at", { ascending: true });

      if (images) {
        const imagesWithUrls: CarImage[] = [];

        for (const image of images) {
          const { data } = await supabase.storage
            .from("car-images")
            .createSignedUrl(image.image_url, 60 * 60);

          if (data?.signedUrl) {
            imagesWithUrls.push({
              id: image.id,
              image_url: image.image_url,
              signedUrl: data.signedUrl,
            });
          }
        }

        setExistingImages(imagesWithUrls);
      }

      setLoading(false);
    }

    loadCar();
  }, [carId, router, supabase]);

  // Select new images
  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const files = Array.from(e.target.files || []);

    if (existingImages.length + files.length > 10) {
      setError("A listing can have a maximum of 10 images.");
      return;
    }

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setError("Only image files are allowed.");
      return;
    }

    setSelectedImages(files);

    const previewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(previewUrls);
  }

  // Remove existing image
  async function handleRemoveImage(image: CarImage) {
    setError("");

    const confirmed = window.confirm(
      "Are you sure you want to remove this photo?"
    );

    if (!confirmed) {
      return;
    }

    const { error: storageError } = await supabase.storage
      .from("car-images")
      .remove([image.image_url]);

    if (storageError) {
      setError(storageError.message);
      return;
    }

    const { error: databaseError } = await supabase
      .from("car_images")
      .delete()
      .eq("id", image.id)
      .eq("car_id", carId);

    if (databaseError) {
      setError(databaseError.message);
      return;
    }

    setExistingImages((current) =>
      current.filter((item) => item.id !== image.id)
    );
  }

  // Update car
  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    // Validate the phone number before changing anything
    const rawPhone = String(formData.get("phone") ?? "").trim();
    const newPhone = rawPhone === "" ? null : normalizePkPhone(rawPhone);

    if (rawPhone !== "" && !newPhone) {
      setError(
        "Enter a valid Pakistani mobile number, like 0300 1234567."
      );
      setSaving(false);
      return;
    }

    // Save the number to the profile only if it changed
    if (profilePhone !== undefined && newPhone !== profilePhone) {
      const { data: updated, error: phoneError } = await supabase
        .from("profiles")
        .update({ phone: newPhone })
        .eq("id", user.id)
        .select("id");

      if (phoneError || !updated || updated.length === 0) {
        console.error("phone save failed:", phoneError);
        setError("Could not save your phone number. Please try again.");
        setSaving(false);
        return;
      }
    }

    // Update car information
    const { error: updateError } = await supabase
      .from("cars")
      .update({
        make: formData.get("make") as string,
        model: formData.get("model") as string,
        year: Number(formData.get("year")),
        price: Number(formData.get("price")),
        mileage: Number(formData.get("mileage")),
        fuel_type: formData.get("fuel_type") as string,
        transmission: formData.get("transmission") as string,
        location: formData.get("location") as string,
        description: formData.get("description") as string,
      })
      .eq("id", carId)
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // Upload newly selected images
    for (const file of selectedImages) {
      const filePath = `${user.id}/${carId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(filePath, file);

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }

      const { error: imageError } = await supabase
        .from("car_images")
        .insert({
          car_id: carId,
          image_url: filePath,
        });

      if (imageError) {
        setError(imageError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/dashboard/cars");
    router.refresh();
  }

  if (loading) {
    return (
      <main className={styles.editCarPage}>
        <p className={styles.loadingText}>Loading car...</p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className={styles.editCarPage}>
        <h1 className={styles.stateTitle}>Car Not Found</h1>
        <p className={styles.stateText}>{error || "This car could not be found."}</p>

        <Link className={styles.stateLink} href="/dashboard/cars">
          Back to My Cars
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.editCarPage}>

      {/* Header */}
      <div className={styles.editHeader}>

        <Link className={styles.backLink} href="/dashboard/cars">
          ← Back to My Cars
        </Link>

        <h1>Edit Your Car</h1>

        <p>
          Update your vehicle information and manage your
          listing photos.
        </p>

      </div>

      <form
        className={styles.editForm}
        onSubmit={handleSubmit}
      >

        {/* Basic Information */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>
            <h2>Basic Information</h2>
            <p>Update the basic details of your vehicle.</p>
          </div>

          <div className={styles.formGrid}>

            <div className={styles.formField}>
              <label htmlFor="make">
                Make
              </label>

              <input
                id="make"
                name="make"
                defaultValue={car.make}
                placeholder="e.g. Toyota"
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="model">
                Model
              </label>

              <input
                id="model"
                name="model"
                defaultValue={car.model}
                placeholder="e.g. Corolla"
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="year">
                Year
              </label>

              <input
                id="year"
                name="year"
                type="number"
                defaultValue={car.year}
                min="1900"
                max="2100"
                required
              />
            </div>

          </div>

        </section>

        {/* Price & Mileage */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>
            <h2>Price & Mileage</h2>
            <p>Update the asking price and mileage.</p>
          </div>

          <div className={styles.formGrid}>

            <div className={styles.formField}>
              <label htmlFor="price">
                Price
              </label>

              <div className={styles.inputWithSuffix}>

                <input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={car.price}
                  min="0"
                  required
                />

                <span>PKR</span>

              </div>
            </div>

            <div className={styles.formField}>
              <label htmlFor="mileage">
                Mileage
              </label>

              <div className={styles.inputWithSuffix}>

                <input
                  id="mileage"
                  name="mileage"
                  type="number"
                  defaultValue={car.mileage}
                  min="0"
                  required
                />

                <span>km</span>

              </div>
            </div>

          </div>

        </section>

        {/* Specifications */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>
            <h2>Vehicle Specifications</h2>
            <p>Update the vehicle specifications.</p>
          </div>

          <div className={styles.formGrid}>

            <div className={styles.formField}>

              <label htmlFor="fuel_type">
                Fuel Type
              </label>

              <select
                id="fuel_type"
                name="fuel_type"
                defaultValue={car.fuel_type}
              >
                <option value="Petrol">
                  Petrol
                </option>

                <option value="Diesel">
                  Diesel
                </option>

                <option value="Hybrid">
                  Hybrid
                </option>

                <option value="Electric">
                  Electric
                </option>
              </select>

            </div>

            <div className={styles.formField}>

              <label htmlFor="transmission">
                Transmission
              </label>

              <select
                id="transmission"
                name="transmission"
                defaultValue={car.transmission}
              >
                <option value="Manual">
                  Manual
                </option>

                <option value="Automatic">
                  Automatic
                </option>
              </select>

            </div>

          </div>

        </section>

        {/* Location */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>
            <h2>Location</h2>
            <p>Where is the vehicle currently located?</p>
          </div>

          <div className={styles.formField}>

            <label htmlFor="location">
              Location
            </label>

            <input
              id="location"
              name="location"
              defaultValue={car.location}
              placeholder="e.g. Islamabad"
              required
            />

          </div>

        </section>

        {/* Contact */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>
            <h2>Contact</h2>
            <p>
              Optional. Logged-in buyers will see Call and WhatsApp
              buttons. This number is saved to your profile and used
              for all your listings. Leave it empty to hide it.
            </p>
          </div>

          <div className={styles.formField}>

            <label htmlFor="phone">
              Phone / WhatsApp number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={
                profilePhone ? formatPkPhone(profilePhone) : ""
              }
              placeholder="e.g. 0300 1234567"
            />

          </div>

        </section>

        {/* Description */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>
            <h2>Description</h2>
            <p>Update the information buyers should know.</p>
          </div>

          <div className={styles.formField}>

            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              defaultValue={car.description || ""}
              placeholder="Describe the condition, history, features, and other useful information..."
              rows={7}
            />

          </div>

        </section>

        {/* Existing Images */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>

            <h2>Current Photos</h2>

            <p>
              Manage the photos currently attached to this
              listing.
            </p>

          </div>

          {existingImages.length === 0 ? (
            <p className={styles.noImages}>
              No photos currently uploaded.
            </p>
          ) : (
            <div className={styles.existingImageGrid}>

              {existingImages.map((image, index) => (
                <div
                  className={styles.existingImage}
                  key={image.id}
                >

                  <img
                    src={image.signedUrl}
                    alt={`${car.make} ${car.model} photo ${index + 1}`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveImage(image)
                    }
                  >
                    Remove
                  </button>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* Add New Images */}
        <section className={styles.formSection}>

          <div className={styles.formSectionHeader}>

            <h2>Add More Photos</h2>

            <p>
              Select multiple additional photos. A listing
              can contain up to 10 photos.
            </p>

          </div>

          <label
            htmlFor="new-images"
            className={styles.imageUploadBox}
          >
            <span className={styles.uploadIcon}>
              +
            </span>

            <strong>
              Choose Photos
            </strong>

            <small>
              Select multiple images from your computer
            </small>
          </label>

          <input
            id="new-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            hidden
          />

          {previews.length > 0 && (
            <div className={styles.imagePreviewSection}>

              <p>
                New photos ({selectedImages.length})
              </p>

              <div className={styles.imagePreviewGrid}>

                {previews.map((preview, index) => (
                  <div
                    className={styles.imagePreview}
                    key={preview}
                  >

                    <img
                      src={preview}
                      alt={`New car photo ${index + 1}`}
                    />

                    <span>
                      {index + 1}
                    </span>

                  </div>
                ))}

              </div>

            </div>
          )}

        </section>

        {/* Error */}
        {error && (
          <div className={styles.formError}>
            {error}
          </div>
        )}

        {/* Submit */}
        <div className={styles.formActions}>

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Updating Listing..."
              : "Update Car Listing"}
          </button>

        </div>

      </form>

    </main>
  );
}