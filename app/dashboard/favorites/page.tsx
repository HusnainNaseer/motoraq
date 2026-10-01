import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import FavoriteButton from "@/app/favorites/favorite-button";
import styles from "./favorite.module.css";

export default async function SavedCarsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/favorites");
  }

  // Newest saved first. Cars that were deleted are removed automatically,
  // and cars you can't see simply come back as null and are skipped.
  const { data: rows, error } = await supabase
    .from("favorites")
    .select(
      "created_at, cars(id, make, model, year, price, mileage, fuel_type, transmission, location)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("SavedCarsPage query failed:", error);
    return (
      <main className={styles.page}>
        <div className={styles.errorBox}>
          <h1>Saved Cars</h1>
          <p>Could not load your saved cars. Please try again.</p>
        </div>
      </main>
    );
  }

  const cars = (rows ?? [])
    .map((row) => (Array.isArray(row.cars) ? row.cars[0] : row.cars))
    .filter((car) => !!car);

  // First photo for each car: 2 calls total, not 2 per car
  const imageUrlByCar = new Map<number, string>();

  if (cars.length > 0) {
    const { data: imageRows } = await supabase
      .from("car_images")
      .select("car_id, image_url")
      .in(
        "car_id",
        cars.map((car) => car.id)
      )
      .order("id", { ascending: true });

    const pathByCar = new Map<number, string>();
    for (const row of imageRows ?? []) {
      if (!pathByCar.has(row.car_id)) pathByCar.set(row.car_id, row.image_url);
    }

    const paths = [...pathByCar.values()];

    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("car-images")
        .createSignedUrls(paths, 60 * 60);

      const urlByPath = new Map<string, string>();
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
      }

      for (const [carId, path] of pathByCar) {
        const url = urlByPath.get(path);
        if (url) imageUrlByCar.set(carId, url);
      }
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Saved Cars</h1>

      {cars.length === 0 ? (
        <p>You haven&apos;t saved any cars yet. <Link href="/cars">Browse cars</Link> and tap Save on the ones you like.</p>
      ) : (
        <p>{cars.length} saved {cars.length === 1 ? "car" : "cars"}</p>
      )}
      </header>

      {cars.length > 0 && (
        <section className={styles.grid}>
          {cars.map((car) => {
            const imageUrl = imageUrlByCar.get(car.id);

            return (
              <article className={styles.card} key={car.id}>
                <div className={styles.imageWrap}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${car.make} ${car.model}`}
                    />
                  ) : (
                    <p className={styles.noImage}>No image available</p>
                  )}
                </div>

                <div className={styles.body}>
                  <p className={styles.location}>{car.location}</p>
                  <h2 className={styles.title}>
                    {car.make} {car.model}
                  </h2>
                  <p className={styles.meta}>Year: {car.year}</p>
                  <p className={styles.price}>
                    PKR {new Intl.NumberFormat("en-PK").format(Number(car.price))}
                  </p>
                  <p className={styles.meta}>
                    Mileage: {new Intl.NumberFormat("en-PK").format(Number(car.mileage))} km
                  </p>
                  <p className={styles.meta}>Fuel: {car.fuel_type}</p>
                  <p className={styles.meta}>Transmission: {car.transmission}</p>

                  <div className={styles.actions}>
                    <Link className={styles.viewLink} href={`/cars/${car.id}`}>
                      View Details
                    </Link>
                    <FavoriteButton
                      carId={car.id}
                      initialSaved={true}
                      isLoggedIn={true}
                      redirectTo="/dashboard/favorites"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}