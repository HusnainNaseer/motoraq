import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * The dashboard layout already protects this route.
   * The extra check keeps TypeScript happy and protects
   * this page if its structure changes later.
   */
  if (!user) {
    return null;
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  // Get user's cars
  const { data: cars, error } = await supabase
    .from("cars")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Handle database error
  if (error) {
    return (
      <main className={styles.dashboardPage}>
        <div className={styles.errorBox}>
          <h1>Something went wrong</h1>

          <p>
            We couldn't load your dashboard.
            Please try again later.
          </p>
        </div>
      </main>
    );
  }

  const totalCars = cars?.length || 0;
  const recentCars = cars?.slice(0, 3) || [];

  const displayName =
    profile?.full_name ||
    user.email?.split("@")[0] ||
    "Seller";

  return (
    <main className={styles.dashboardPage}>
      {/* Header */}
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.pageLabel}>
            Seller Dashboard
          </p>

          <h1>
            Welcome back, {displayName}
          </h1>

          <p>
            Manage your Motoraq listings and keep your
            vehicles up to date.
          </p>
        </div>

        <Link
          href="/dashboard/cars/add"
          className={styles.primaryButton}
        >
          + Sell Your Car
        </Link>
      </header>

      {/* Statistics */}
      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span>Total Listings</span>

          <strong>
            {totalCars}
          </strong>

          <p>
            {totalCars === 1
              ? "Vehicle listed"
              : "Vehicles listed"}
          </p>
        </article>

        <article className={styles.statCard}>
          <span>Account Type</span>

          <strong>
            {profile?.role === "admin"
              ? "Admin"
              : "Seller"}
          </strong>

          <p>
            Motoraq account
          </p>
        </article>

        <article className={styles.statCard}>
          <span>Marketplace</span>

          <strong>
            Open
          </strong>

          <p>
            Browse available vehicles
          </p>
        </article>
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>
              Get Started
            </p>

            <h2>
              Quick Actions
            </h2>
          </div>
        </div>

        <div className={styles.actionGrid}>
          <Link
            href="/dashboard/cars"
            className={styles.actionCard}
          >
            <span className={styles.actionIcon}>
              🚗
            </span>

            <div>
              <h3>
                My Cars
              </h3>

              <p>
                View and manage your vehicle listings.
              </p>
            </div>

            <span className={styles.actionArrow}>
              →
            </span>
          </Link>

          <Link
            href="/dashboard/cars/add"
            className={styles.actionCard}
          >
            <span className={styles.actionIcon}>
              +
            </span>

            <div>
              <h3>
                Sell Your Car
              </h3>

              <p>
                Create a new vehicle listing.
              </p>
            </div>

            <span className={styles.actionArrow}>
              →
            </span>
          </Link>

          <Link
            href="/dashboard/favorites"
            className={styles.actionCard}
          >
            <span className={styles.actionIcon}>
              ♥
            </span>

            <div>
              <h3>
                Saved Cars
              </h3>

              <p>
                Cars you saved while browsing.
              </p>
            </div>

            <span className={styles.actionArrow}>
              →
            </span>
          </Link>

          <Link
            href="/dashboard/profile"
            className={styles.actionCard}
          >
            <span className={styles.actionIcon}>
              👤
            </span>

            <div>
              <h3>
                My Profile
              </h3>

              <p>
                {profile?.phone
                  ? "Update the phone number buyers see."
                  : "Add your phone number so buyers can reach you."}
              </p>
            </div>

            <span className={styles.actionArrow}>
              →
            </span>
          </Link>

          <Link
            href="/cars"
            className={styles.actionCard}
          >
            <span className={styles.actionIcon}>
              🔎
            </span>

            <div>
              <h3>
                Browse Marketplace
              </h3>

              <p>
                Find cars listed by other sellers.
              </p>
            </div>

            <span className={styles.actionArrow}>
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Recent Listings */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>
              Your Inventory
            </p>

            <h2>
              Recent Listings
            </h2>
          </div>

          {totalCars > 0 && (
            <Link
              href="/dashboard/cars"
              className={styles.viewAll}
            >
              View All →
            </Link>
          )}
        </div>

        {recentCars.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              🚗
            </div>

            <h3>
              No car listings yet
            </h3>

            <p>
              You haven't listed a vehicle on Motoraq.
              Start selling your car today.
            </p>

            <Link
              href="/dashboard/cars/add"
              className={styles.primaryButton}
            >
              Sell Your Car
            </Link>
          </div>
        ) : (
          <div className={styles.recentList}>
            {recentCars.map((car) => (
              <article
                key={car.id}
                className={styles.recentCard}
              >
                <div>
                  <p className={styles.location}>
                    {car.location}
                  </p>

                  <h3>
                    {car.make} {car.model}
                  </h3>

                  <p className={styles.carMeta}>
                    {car.year} •{" "}
                    {car.transmission} •{" "}
                    {Number(car.mileage).toLocaleString()} km
                  </p>
                </div>

                <div className={styles.recentRight}>
                  <strong>
                    PKR{" "}
                    {Number(car.price).toLocaleString(
                      "en-PK"
                    )}
                  </strong>

                  <div className={styles.recentActions}>
                    <Link
                      href={`/cars/${car.id}`}
                    >
                      View
                    </Link>

                    <Link
                      href={`/dashboard/cars/${car.id}/edit`}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Account Information */}
      <section className={styles.accountCard}>
        <div>
          <p className={styles.sectionLabel}>
            Account
          </p>

          <h2>
            Your Account
          </h2>

          <p>
            {user.email}
          </p>
        </div>

        <Link
          href="/dashboard/cars"
          className={styles.secondaryButton}
        >
          Manage My Cars
        </Link>
      </section>
    </main>
  );
}