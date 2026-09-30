import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./cars.module.css";

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    fuel?: string;
    transmission?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const {
    search,
    fuel,
    transmission,
    minPrice,
    maxPrice,
    sort,
    page,
  } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("cars")
    .select("*", { count: "exact" });

  // Search
  if (search) {
    query = query.or(
      `make.ilike.%${search}%,model.ilike.%${search}%`
    );
  }

  // Fuel filter
  if (fuel) {
    query = query.eq("fuel_type", fuel);
  }

  // Transmission filter
  if (transmission) {
    query = query.eq("transmission", transmission);
  }

  // Minimum price
  if (minPrice) {
    query = query.gte("price", Number(minPrice));
  }

  // Maximum price
  if (maxPrice) {
    query = query.lte("price", Number(maxPrice));
  }

  // Sorting
  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "year_desc") {
    query = query.order("year", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Pagination
  const currentPage = Number(page) || 1;
  const pageSize = 6;

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data: cars, error, count } = await query;

  if (error) {
    return <p>Failed to load cars.</p>;
  }

  const totalCars = count || 0;

  const hasPrevious = currentPage > 1;
  const hasNext = from + cars.length < totalCars;

  // Get first image for each car
  const carsWithImages = await Promise.all(
    cars.map(async (car) => {
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

  return (
    <main className={styles.browse}>
      <h1>Browse Cars</h1>

      <form method="GET">
        <input
          name="search"
          placeholder="Search by make or model"
          defaultValue={search || ""}
        />

        <select name="fuel" defaultValue={fuel || ""}>
          <option value="">All Fuel Types</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>

        <select
          name="transmission"
          defaultValue={transmission || ""}
        >
          <option value="">All Transmissions</option>
          <option value="Manual">Manual</option>
          <option value="Automatic">Automatic</option>
        </select>

        <input
          name="minPrice"
          type="number"
          placeholder="Minimum Price"
          defaultValue={minPrice || ""}
        />

        <input
          name="maxPrice"
          type="number"
          placeholder="Maximum Price"
          defaultValue={maxPrice || ""}
        />

        <select name="sort" defaultValue={sort || ""}>
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="year_desc">Newest Year</option>
        </select>

        <button type="submit">Apply Filters</button>
      </form>

      <p>
        Page {currentPage} — Total Cars: {totalCars}
      </p>

      {carsWithImages.length === 0 ? (
        <p>No cars found.</p>
      ) : (
        carsWithImages.map((car) => (
          <div key={car.id}>
            {car.imageUrl ? (
              <img
                src={car.imageUrl}
                alt={`${car.make} ${car.model}`}
                width={300}
              />
            ) : (
              <p>No image available</p>
            )}

            <h2>
              {car.make} {car.model}
            </h2>

            <p>Year: {car.year}</p>
            <p>Price: {car.price}</p>
            <p>Mileage: {car.mileage} km</p>
            <p>Fuel: {car.fuel_type}</p>
            <p>Transmission: {car.transmission}</p>
            <p>Location: {car.location}</p>

            <Link href={`/cars/${car.id}`}>
              View Details
            </Link>
          </div>
        ))
      )}

      <div>
        {hasPrevious && (
          <Link
            href={`/cars?${new URLSearchParams({
              search: search || "",
              fuel: fuel || "",
              transmission: transmission || "",
              minPrice: minPrice || "",
              maxPrice: maxPrice || "",
              sort: sort || "",
              page: String(currentPage - 1),
            }).toString()}`}
          >
            Previous
          </Link>
        )}

        {" "}

        {hasNext && (
          <Link
            href={`/cars?${new URLSearchParams({
              search: search || "",
              fuel: fuel || "",
              transmission: transmission || "",
              minPrice: minPrice || "",
              maxPrice: maxPrice || "",
              sort: sort || "",
              page: String(currentPage + 1),
            }).toString()}`}
          >
            Next
          </Link>
        )}
      </div>
    </main>
  );
}