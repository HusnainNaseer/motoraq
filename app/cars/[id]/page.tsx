import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./car-details.module.css";

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  // Get car
  const { data: car, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !car) {
    notFound();
  }

  // Get car images
  const { data: images } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", car.id)
    .order("created_at", { ascending: true });

  // Create signed URLs
  const imageUrls: string[] = [];

  if (images) {
    for (const image of images) {
      const { data } = await supabase.storage
        .from("car-images")
        .createSignedUrl(image.image_url, 60 * 60);

      if (data?.signedUrl) {
        imageUrls.push(data.signedUrl);
      }
    }
  }

  // Get seller information
  const { data: seller } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", car.user_id)
    .single();

  // Format price
  const formattedPrice = new Intl.NumberFormat("en-PK").format(
    Number(car.price)
  );

  // Format mileage
  const formattedMileage = new Intl.NumberFormat("en-PK").format(
    Number(car.mileage)
  );

  // Format listing date
  const listingDate = new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(car.created_at));

  return (
    <main className={styles["car-details"]}>

      {/* Back to marketplace */}
      <Link href="/cars">
        ← Back to Browse Cars
      </Link>

      {/* Main listing */}
      <section className="car-details-layout">

        {/* Image section */}
        <div className="car-gallery">

          {imageUrls.length === 0 ? (
            <div className="car-no-image">
              <p>No images available</p>
            </div>
          ) : (
            <div className="car-images">

              {imageUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={`${car.make} ${car.model} - Image ${index + 1}`}
                />
              ))}

            </div>
          )}

        </div>

        {/* Information section */}
        <div className="car-information">

          {/* Header */}
          <div className="car-header">

            <p className="car-location">
              {car.location}
            </p>

            <h1>
              {car.make} {car.model}
            </h1>

            <p className="car-year">
              {car.year}
            </p>

            <p className="car-price">
              PKR {formattedPrice}
            </p>

          </div>

          {/* Specifications */}
          <section className="car-specifications">

            <h2>Car Specifications</h2>

            <div className="specifications-grid">

              <div className="specification">
                <span>Year</span>
                <strong>{car.year}</strong>
              </div>

              <div className="specification">
                <span>Mileage</span>
                <strong>{formattedMileage} km</strong>
              </div>

              <div className="specification">
                <span>Fuel Type</span>
                <strong>{car.fuel_type}</strong>
              </div>

              <div className="specification">
                <span>Transmission</span>
                <strong>{car.transmission}</strong>
              </div>

            </div>

          </section>

          {/* Description */}
          <section className="car-description">

            <h2>Description</h2>

            <p>
              {car.description ||
                "The seller has not provided a description for this vehicle."}
            </p>

          </section>

          {/* Listing information */}
          <section className="listing-information">

            <h2>Listing Information</h2>

            <p>
              <span>Listing ID</span>
              <strong>#{car.id}</strong>
            </p>

            <p>
              <span>Listed on</span>
              <strong>{listingDate}</strong>
            </p>

          </section>

          {/* Seller information */}
          <section className="seller-information">

            <h2>Seller</h2>

            <p>
              <span>Name</span>
              <strong>
                {seller?.full_name || "Motoraq Seller"}
              </strong>
            </p>

          </section>

        </div>

      </section>

    </main>
  );
}