import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./cars.module.css";

const PAGE_SIZE = 6;
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];
const TRANSMISSIONS = ["Manual", "Automatic"];

type SearchParams = {
  search?: string;
  fuel?: string;
  transmission?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

// Returns a valid non-negative number, or undefined if the input is junk
function toPrice(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// Split the search into safe words (removes characters that break the filter)
function toSearchTerms(value?: string) {
  return (value ?? "")
    .replace(/[,()%*\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((term) => term.slice(0, 40));
}

function buildHref(
  filters: Record<string, string | number | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { search, fuel, transmission, minPrice, maxPrice, sort, page } =
    await searchParams;

  const supabase = await createClient();

  const terms = toSearchTerms(search);
  const validFuel = fuel && FUEL_TYPES.includes(fuel) ? fuel : undefined;
  const validTransmission =
    transmission && TRANSMISSIONS.includes(transmission)
      ? transmission
      : undefined;
  const min = toPrice(minPrice);
  const max = toPrice(maxPrice);

  const currentPage = Math.min(
    Math.max(Math.floor(Number(page)) || 1, 1),
    1000
  );
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("cars")
    .select(
      "id, make, model, year, price, mileage, fuel_type, transmission, location",
      { count: "exact" }
    );

  // Every word must match the make or the model
  for (const term of terms) {
    query = query.or(`make.ilike.%${term}%,model.ilike.%${term}%`);
  }

  if (validFuel) query = query.eq("fuel_type", validFuel);
  if (validTransmission) query = query.eq("transmission", validTransmission);
  if (min !== undefined) query = query.gte("price", min);
  if (max !== undefined) query = query.lte("price", max);

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "year_desc") {
    query = query.order("year", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Tiebreaker so pages never repeat or skip cars
  query = query.order("id", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  

  // PGRST103 = page number beyond the last page; show "No cars found"
  if (error && error.code !== "PGRST103") {
    console.error("CarsPage query failed:", error);
    return <p>Failed to load cars.</p>;
  }

  const cars = data ?? [];
  const totalCars = count ?? 0;
  const hasPrevious = currentPage > 1;
  const hasNext = from + cars.length < totalCars;

  // First photo for every car on this page: 2 calls total, not 2 per car
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

  const carsWithImages = cars.map((car) => ({
    ...car,
    imageUrl: imageUrlByCar.get(car.id) ?? null,
  }));

  const filters = {
    search: search?.trim(),
    fuel: validFuel,
    transmission: validTransmission,
    minPrice: min,
    maxPrice: max,
    sort: sort || undefined,
  };

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

        <select name="transmission" defaultValue={transmission || ""}>
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

            <Link href={`/cars/${car.id}`}>View Details</Link>
          </div>
        ))
      )}

      <div>
        {hasPrevious && (
          <Link href={buildHref(filters, currentPage - 1)}>Previous</Link>
        )}

        {" "}

        {hasNext && (
          <Link href={buildHref(filters, currentPage + 1)}>Next</Link>
        )}
      </div>
    </main>
  );
}