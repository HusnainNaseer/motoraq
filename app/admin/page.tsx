import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Get total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get total cars
  const { count: totalCars } = await supabase
    .from("cars")
    .select("*", { count: "exact", head: true });

  // Get latest cars
  const { data: recentCars } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className={styles.adminPage}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Admin Dashboard</h1>

          <p className={styles.heroWelcome}>
            Welcome, {profile.full_name || user.email}
          </p>
        </div>

        {/* Decorative radar, hidden from screen readers */}
        <div className={styles.radar} aria-hidden="true">
          <div className={styles.radarSweep}></div>
        </div>
      </div>

      {/* Statistics */}
      <section className={styles.statsSection}>
        <div className={styles.statCard}>
          <h2 className={styles.statLabel}>Total Users</h2>
          {/* The real number is in the hidden span. The counter span is the animated copy. */}
          <p
            className={styles.statValue}
            style={{ "--target": totalUsers || 0 } as CSSProperties}
          >
            <span className={styles.srOnly}>{totalUsers || 0}</span>
            <span className={styles.counter} aria-hidden="true"></span>
          </p>
        </div>

        <div className={styles.statCard}>
          <h2 className={styles.statLabel}>Total Cars</h2>
          <p
            className={styles.statValue}
            style={{ "--target": totalCars || 0 } as CSSProperties}
          >
            <span className={styles.srOnly}>{totalCars || 0}</span>
            <span className={styles.counter} aria-hidden="true"></span>
          </p>
        </div>
      </section>

      {/* Admin Navigation */}
      <section className={styles.managePanel}>
        <h2 className={styles.sectionTitle}>Management</h2>

        <div className={styles.linkRow}>
          <Link href="/admin/users" className={styles.manageLink}>
            Manage Users
          </Link>

          {" "}

          <Link
            href="/admin/cars"
            className={`${styles.manageLink} ${styles.manageLinkAlt}`}
          >
            Manage Cars
          </Link>
        </div>
      </section>

      {/* Recent Cars */}
      <section className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Recent Car Listings</h2>

        {!recentCars || recentCars.length === 0 ? (
          <p className={styles.emptyText}>No cars available.</p>
        ) : (
          <div className={styles.carGrid}>
            {recentCars.map((car) => (
              <div key={car.id} className={styles.carCard}>
                <h3 className={styles.carTitle}>
                  {car.make} {car.model}
                </h3>

                <p className={styles.carMeta}>
                  Year: {car.year}
                </p>

                <p className={`${styles.carMeta} ${styles.carPrice}`}>
                  Price: {car.price}
                </p>

                <p className={styles.carMeta}>
                  Location: {car.location}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}