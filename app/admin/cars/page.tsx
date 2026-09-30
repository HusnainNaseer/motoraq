import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAdminCar } from "../actions";
import styles from "./admin-cars.module.css";

const PAGE_SIZE = 20;

type SearchParams = {
  search?: string;
  location?: string;
  fuel?: string;
  transmission?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  // Admin check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Filters
  const search = params.search?.trim() || "";
  const location = params.location?.trim() || "";
  const fuel = params.fuel?.trim() || "";
  const transmission = params.transmission?.trim() || "";

  const minPrice = params.minPrice
    ? Number(params.minPrice)
    : null;

  const maxPrice = params.maxPrice
    ? Number(params.maxPrice)
    : null;

  const currentPage = Math.max(
    1,
    Number(params.page) || 1
  );

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Cars query
  let query = supabase
    .from("cars")
    .select(
      `
        id,
        make,
        model,
        year,
        price,
        mileage,
        fuel_type,
        transmission,
        location,
        created_at,
        car_images (
          image_url
        )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Search: make / model / location
  if (search) {
    query = query.or(
      `make.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  if (fuel) {
    query = query.eq("fuel_type", fuel);
  }

  if (transmission) {
    query = query.eq("transmission", transmission);
  }

  if (minPrice !== null && !Number.isNaN(minPrice)) {
    query = query.gte("price", minPrice);
  }

  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    query = query.lte("price", maxPrice);
  }

  const {
    data: cars,
    error,
    count,
  } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const totalCars = count || 0;
  const totalPages = Math.max(
    1,
    Math.ceil(totalCars / PAGE_SIZE)
  );

  // Create signed URLs for first car image
  const carsWithImages = await Promise.all(
    (cars || []).map(async (car) => {
      const firstImage = car.car_images?.[0];

      let imageUrl: string | null = null;

      if (firstImage?.image_url) {
        const { data } = await supabase.storage
          .from("car-images")
          .createSignedUrl(firstImage.image_url, 60 * 60);

        imageUrl = data?.signedUrl || null;
      }

      return {
        ...car,
        imageUrl,
      };
    })
  );

  function buildPageUrl(page: number) {
    const searchParams = new URLSearchParams();

    if (search) searchParams.set("search", search);
    if (location) searchParams.set("location", location);
    if (fuel) searchParams.set("fuel", fuel);
    if (transmission)
      searchParams.set("transmission", transmission);

    if (params.minPrice)
      searchParams.set("minPrice", params.minPrice);

    if (params.maxPrice)
      searchParams.set("maxPrice", params.maxPrice);

    searchParams.set("page", String(page));

    return `/admin/cars?${searchParams.toString()}`;
  }

  return (
    <main className={styles.adminPage}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1>Cars</h1>

          <p>Manage all vehicle listings</p>
        </div>

        <Link
          href="/admin"
          className={styles.secondaryButton}
        >
          ← Admin Dashboard
        </Link>

        <Link
          href="/admin/cars/new"
          className={styles.addButton}
        >
          + Add Car
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className={styles.filterCard}>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search make, model..."
          aria-label="Search make, model or location"
          className={styles.field}
        />

        <input
          type="text"
          name="location"
          defaultValue={location}
          placeholder="Location"
          aria-label="Location"
          className={styles.field}
        />

        <select
          name="fuel"
          defaultValue={fuel}
          aria-label="Fuel type"
          className={styles.field}
        >
          <option value="">All fuel types</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Electric">Electric</option>
        </select>

        <select
          name="transmission"
          defaultValue={transmission}
          aria-label="Transmission"
          className={styles.field}
        >
          <option value="">All transmissions</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>

        <input
          type="number"
          name="minPrice"
          defaultValue={params.minPrice || ""}
          placeholder="Min price"
          aria-label="Minimum price"
          className={styles.field}
        />

        <input
          type="number"
          name="maxPrice"
          defaultValue={params.maxPrice || ""}
          placeholder="Max price"
          aria-label="Maximum price"
          className={styles.field}
        />

        <div className={styles.filterActions}>
          <button
            type="submit"
            className={styles.primaryButton}
          >
            Search
          </button>

          <Link
            href="/admin/cars"
            className={styles.clearButton}
          >
            Clear
          </Link>
        </div>
      </form>

      {/* Results */}
      <div className={styles.resultsCard}>
        <div className={styles.resultsBar}>
          <p className={styles.resultsCount}>
            {totalCars} {totalCars === 1 ? "car" : "cars"} found
          </p>
        </div>

        {carsWithImages.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No cars found</p>
            <p className={styles.emptyText}>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.carsTable}>
              <thead>
                <tr>
                  <th>Car</th>
                  <th>Year</th>
                  <th>Price</th>
                  <th>Mileage</th>
                  <th>Fuel</th>
                  <th>Transmission</th>
                  <th>Location</th>
                  <th className={styles.thRight}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {carsWithImages.map((car) => (
                  <tr key={car.id}>
                    {/* Car */}
                    <td>
                      <div className={styles.carInfo}>
                        {car.imageUrl ? (
                          <img
                            src={car.imageUrl}
                            alt={`${car.make} ${car.model}`}
                            className={styles.thumb}
                          />
                        ) : (
                          <div className={styles.noImage}>
                            No image
                          </div>
                        )}

                        <div>
                          <p className={styles.carName}>
                            {car.make} {car.model}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Year */}
                    <td>{car.year}</td>

                    {/* Price */}
                    <td className={styles.priceCell}>
                      {car.price != null
                        ? `PKR ${Number(
                            car.price
                          ).toLocaleString()}`
                        : "—"}
                    </td>

                    {/* Mileage */}
                    <td>
                      {car.mileage != null
                        ? `${Number(
                            car.mileage
                          ).toLocaleString()} km`
                        : "—"}
                    </td>

                    {/* Fuel */}
                    <td>{car.fuel_type || "—"}</td>

                    {/* Transmission */}
                    <td>{car.transmission || "—"}</td>

                    {/* Location */}
                    <td>{car.location || "—"}</td>

                    {/* Actions */}
                    <td>
                      <div className={styles.tableActions}>
                        <Link
                          href={`/cars/${car.id}`}
                          className={styles.actionLink}
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/cars/${car.id}/edit`}
                          className={`${styles.actionLink} ${styles.editLink}`}
                        >
                          Edit
                        </Link>

                        <form action={deleteAdminCar}>
                          <input
                            type="hidden"
                            name="carId"
                            value={car.id}
                          />
                          <button
                            type="submit"
                            style={{
                              padding: "6px 10px",
                              border: 0,
                              borderRadius: 4,
                              backgroundColor: "#dc2626",
                              color: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <p className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </p>

          <div className={styles.pageButtons}>
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className={styles.pageButton}
              >
                Previous
              </Link>
            ) : (
              <span
                className={`${styles.pageButton} ${styles.disabled}`}
              >
                Previous
              </span>
            )}

            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className={styles.pageButton}
              >
                Next
              </Link>
            ) : (
              <span
                className={`${styles.pageButton} ${styles.disabled}`}
              >
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
}