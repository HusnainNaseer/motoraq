"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePkPhone, formatPkPhone } from "@/lib/supabase/phone";
import styles from "./add-car.module.css";

export default function AddCarPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Phone number lives on the seller's profile (one number for all listings).
  // profilePhone: undefined = not loaded yet, null = none saved, string = saved
  const [phone, setPhone] = useState("");
  const [profilePhone, setProfilePhone] = useState<
    string | null | undefined
  >(undefined);

  // Pre-fill the phone field if the seller already saved one
  useEffect(() => {
    async function loadPhone() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();

      // If this fails we leave profilePhone undefined, so submitting the
      // form will not touch the saved number.
      if (profileError) return;

      const saved = profile?.phone ?? null;
      setProfilePhone(saved);

      if (saved) {
        setPhone(formatPkPhone(saved));
      }
    }

    loadPhone();
  }, [supabase]);

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const files = Array.from(e.target.files || []);

    if (files.length > 10) {
      setError("You can upload a maximum of 10 images.");
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

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to add a car.");
      setLoading(false);
      return;
    }

    // Validate the phone number before creating anything
    const rawPhone = String(formData.get("phone") ?? "").trim();
    const newPhone = rawPhone === "" ? null : normalizePkPhone(rawPhone);

    if (rawPhone !== "" && !newPhone) {
      setError(
        "Enter a valid Pakistani mobile number, like 0300 1234567."
      );
      setLoading(false);
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
        setLoading(false);
        return;
      }
    }

    // Create car first
    const { data: car, error: carError } = await supabase
      .from("cars")
      .insert({
        user_id: user.id,
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
      .select()
      .single();

    if (carError || !car) {
      setError(
        carError?.message || "Failed to create car listing."
      );
      setLoading(false);
      return;
    }

    // Upload multiple images
    for (const file of selectedImages) {
      const filePath = `${user.id}/${car.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(filePath, file);

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      // Save image path in database
      const { error: imageError } = await supabase
        .from("car_images")
        .insert({
          car_id: car.id,
          image_url: filePath,
        });

      if (imageError) {
        setError(imageError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard/cars");
    router.refresh();
  }

  return (
    <main className={styles["add-car-page"]}>
      <div className="add-car-header">
        <h1>Sell Your Car</h1>

        <p>
          Add your vehicle details and photos to create a
          listing on Motoraq.
        </p>
      </div>
      <br></br>

      <form
        className="add-car-form"
        onSubmit={handleSubmit}
      >

        {/* Basic Information */}
        <section className="form-section">

          <div className="form-section-header">
            <h2>Basic Information</h2>
            <p>Tell buyers about the vehicle.</p>
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label htmlFor="make">
                Make
              </label>

              <input
                id="make"
                name="make"
                placeholder="e.g. Toyota"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="model">
                Model
              </label>

              <input
                id="model"
                name="model"
                placeholder="e.g. Corolla"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="year">
                Year
              </label>

              <input
                id="year"
                name="year"
                type="number"
                placeholder="e.g. 2022"
                min="1900"
                max="2100"
                required
              />
            </div>

          </div>

        </section>

        {/* Price and Mileage */}
        <section className="form-section">

          <div className="form-section-header">
            <h2>Price & Mileage</h2>
            <p>Provide the asking price and vehicle mileage.</p>
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label htmlFor="price">
                Price
              </label>

              <div className="input-with-suffix">
                <input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="e.g. 4500000"
                  min="0"
                  required
                />

                <span>PKR</span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="mileage">
                Mileage
              </label>

              <div className="input-with-suffix">
                <input
                  id="mileage"
                  name="mileage"
                  type="number"
                  placeholder="e.g. 45000"
                  min="0"
                  required
                />

                <span>km</span>
              </div>
            </div>

          </div>

        </section>

        {/* Specifications */}
        <section className="form-section">

          <div className="form-section-header">
            <h2>Vehicle Specifications</h2>
            <p>Select the basic specifications of the vehicle.</p>
          </div>

          <div className="form-grid">

            <div className="form-field">
              <label htmlFor="fuel_type">
                Fuel Type
              </label>

              <select
                id="fuel_type"
                name="fuel_type"
                defaultValue="Petrol"
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

            <div className="form-field">
              <label htmlFor="transmission">
                Transmission
              </label>

              <select
                id="transmission"
                name="transmission"
                defaultValue="Manual"
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
        <section className="form-section">

          <div className="form-section-header">
            <h2>Location</h2>
            <p>Where is the vehicle currently located?</p>
          </div>

          <div className="form-field">

            <label htmlFor="location">
              Location
            </label>

            <input
              id="location"
              name="location"
              placeholder="e.g. Islamabad"
              required
            />

          </div>

        </section>

        {/* Contact */}
        <section className="form-section">

          <div className="form-section-header">
            <h2>Contact</h2>
            <p>
              Optional. Logged-in buyers will see Call and WhatsApp
              buttons. This number is saved to your profile and used
              for all your listings.
            </p>
          </div>

          <div className="form-field">

            <label htmlFor="phone">
              Phone / WhatsApp number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="e.g. 0300 1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

          </div>

        </section>

        {/* Description */}
        <section className="form-section">

          <div className="form-section-header">
            <h2>Description</h2>
            <p>
              Give potential buyers more information about
              the vehicle.
            </p>
          </div>

          <div className="form-field">

            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe the condition, history, features, and other useful information..."
              rows={7}
            />

          </div>

        </section>

        {/* Images */}
        <section className="form-section">

          <div className="form-section-header">
            <h2>Photos</h2>

            <p>
              Upload multiple photos of your vehicle.
              You can select up to 10 images.
            </p>
          </div>

          <div className="image-upload">

            <label
              htmlFor="images"
              className="image-upload-box"
            >
              <span className="upload-icon">
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
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              hidden
            />

          </div>

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="image-preview-section">

              <p>
                Selected photos ({selectedImages.length}/10)
              </p>

              <div className="image-preview-grid">

                {previews.map((preview, index) => (
                  <div
                    className="image-preview"
                    key={preview}
                  >
                    <img
                      src={preview}
                      alt={`Selected car photo ${index + 1}`}
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
          <div className="form-error">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="form-actions">

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Listing..."
              : "Publish Car Listing"}
          </button>

        </div>

      </form>

    </main>
  );
}