import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { deleteCar } from "./actions";
import styles from "./my-cars.module.css";

export default async function MyCarsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }
    const { data: cars, error } = await supabase
        .from("cars")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return <p>Failed to load cars.</p>;
    }

    // Get first image for every car
    const carsWithImages = await Promise.all(
        cars.map(async (car) => {
            const { data: images } = await supabase
                .from("car_images")
                .select("image_url")
                .eq("car_id", car.id)
                .order("created_at", { ascending: true })
                .limit(1);

            let imageUrl = null;

            if (images && images.length > 0) {
                const { data } = await supabase.storage
                    .from("car-images")
                    .createSignedUrl(
                        images[0].image_url,
                        60 * 60
                    );

                imageUrl = data?.signedUrl || null;
            }

            return {
                ...car,
                imageUrl,
            };
        })
    );

    return (
        <main className={styles["my-cars-page"]}>
            {/* Page Header */}
            <header className="my-cars-header">

                <div>
                    <p className="page-label">
                        Seller Dashboard
                    </p>

                    <h1>My Cars</h1>

                    <p>
                        Manage your vehicle listings and keep your
                        marketplace inventory up to date.
                    </p>
                </div>

                <Link
                    href="/dashboard/cars/add"
                    className="add-car-button"
                >
                    + Add Car
                </Link>

            </header>

            {/* Empty State */}
            {carsWithImages.length === 0 ? (

                <section className="empty-cars">

                    <h2>No car listings yet</h2>

                    <p>
                        You haven't listed a car on Motoraq yet.
                    </p>

                    <Link
                        href="/dashboard/cars/add"
                        className="add-car-button"
                    >
                        Sell Your Car
                    </Link>

                </section>

            ) : (

                <section className="my-cars-list">

                    {carsWithImages.map((car) => (

                        <article
                            className="my-car-card"
                            key={car.id}
                        >

                            {/* Image */}
                            <div className="my-car-image">

                                {car.imageUrl ? (

                                    <img
                                        src={car.imageUrl}
                                        alt={`${car.make} ${car.model}`}
                                    />

                                ) : (

                                    <div className="no-car-image">
                                        No Image
                                    </div>

                                )}

                            </div>

                            {/* Information */}
                            <div className="my-car-content">

                                <div className="my-car-main">

                                    <p className="my-car-location">
                                        {car.location}
                                    </p>

                                    <h2>
                                        {car.make} {car.model}
                                    </h2>

                                    <p className="my-car-year">
                                        {car.year}
                                    </p>

                                </div>

                                <div className="my-car-specs">

                                    <span>
                                        {Number(car.mileage).toLocaleString()} km
                                    </span>

                                    <span>
                                        {car.fuel_type}
                                    </span>

                                    <span>
                                        {car.transmission}
                                    </span>

                                </div>

                                <p className="my-car-price">
                                    PKR{" "}
                                    {Number(car.price).toLocaleString("en-PK")}
                                </p>

                                {/* Actions */}
                                <div className="my-car-actions">

                                    <Link
                                        href={`/cars/${car.id}`}
                                        className="view-car-button"
                                    >
                                        View Details
                                    </Link>

                                    <Link
                                        href={`/dashboard/cars/${car.id}/edit`}
                                        className="edit-car-button"
                                    >
                                        Edit
                                    </Link>

                                    <form action={deleteCar}>
                                        <input
                                            type="hidden"
                                            name="carId"
                                            value={car.id}
                                        />

                                        <button
                                            type="submit"
                                            className="delete-car-button"
                                        >
                                            Delete
                                        </button>
                                    </form>

                                </div>

                            </div>

                        </article>

                    ))}

                </section>

            )}

        </main>
    );
}