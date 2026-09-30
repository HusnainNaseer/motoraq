import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./home.module.css";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cars } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  const carsWithImages = await Promise.all(
    (cars || []).map(async (car) => {
      const { data: images } = await supabase
        .from("car_images")
        .select("image_url")
        .eq("car_id", car.id)
        .limit(1);

      let imageUrl = null;

      if (images && images.length > 0) {
        const { data } = await supabase.storage
          .from("car-images")
          .createSignedUrl(images[0].image_url, 60 * 60);

        imageUrl = data?.signedUrl || null;
      }

      return {
        ...car,
        imageUrl,
      };
    })
  );

  const sellCarUrl = user
    ? "/dashboard/cars/add"
    : "/login?redirect=/dashboard/cars/add";

  return (
    <main className={styles.home}>
      {/* Hero */}
      <section>
        <h1>Find Your Perfect Car</h1>

        <p>
          Discover quality cars from sellers and find the right vehicle
          for your needs.
        </p>

        <div>
          <Link href="/cars">
            Browse Cars
          </Link>

          {" "}

          <Link href={sellCarUrl}>
            Sell Your Car
          </Link>
        </div>
      </section>

      {/* Search */}
      <section>
        <h2>Search Cars</h2>

        <form action="/cars" method="GET">
          <input
            name="search"
            placeholder="Search by make or model"
          />

          <button type="submit">
            Search
          </button>
        </form>
      </section>

      {/* Latest Cars */}
      <section>
        <h2>Latest Cars</h2>

        {carsWithImages.length === 0 ? (
          <p>No cars available yet.</p>
        ) : (
          <div>
            {carsWithImages.map((car) => (
              <article key={car.id}>
                {car.imageUrl ? (
                  <img
                    src={car.imageUrl}
                    alt={`${car.make} ${car.model}`}
                    width={300}
                  />
                ) : (
                  <p>No image available</p>
                )}

                <h3>
                  {car.make} {car.model}
                </h3>

                <p>Year: {car.year}</p>

                <p>Price: {car.price}</p>

                <p>
                  {car.mileage} km • {car.fuel_type} •{" "}
                  {car.transmission}
                </p>

                <p>Location: {car.location}</p>

                <Link href={`/cars/${car.id}`}>
                  View Details
                </Link>
              </article>
            ))}
          </div>
        )}

        <div>
          <Link href="/cars">
            View All Cars
          </Link>
        </div>
      </section>

      {/* Why Motoraq */}
      <section>
        <h2>Why Choose Motoraq?</h2>

        <div>
          <div>
            <h3>Easy Listings</h3>
            <p>
              Create and manage your car listings easily.
            </p>
          </div>

          <div>
            <h3>Powerful Search</h3>
            <p>
              Find cars using search, filters and sorting.
            </p>
          </div>

          <div>
            <h3>Simple Marketplace</h3>
            <p>
              Browse cars and view complete vehicle details.
            </p>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section>
        <h2>Ready to Sell Your Car?</h2>

        <p>
          Create your listing and reach people looking for their next car.
        </p>

        <Link href={sellCarUrl}>
          Sell Your Car
        </Link>
      </section>
    </main>
  );
}