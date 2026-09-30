import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import styles from "./layout.module.css";
import { createClient } from "@/lib/supabase/server";
import Navigation from "./navigation";

export const metadata: Metadata = {
  title: "Motoraq — Modern Car Marketplace",
  description:
    "Find, buy and sell cars with Motoraq.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin";
  }

  // Guests go to login first, then come back to the sell page
  const sellHref = user
    ? "/dashboard/cars/add"
    : "/login?redirect=/dashboard/cars/add";

  return (
    <html lang="en">
      <body>
        <header className={styles.navbar}>
          <div className="navbar-container">
            <Link href="/" className="logo">
              Motoraq
            </Link>

            <Navigation
              isLoggedIn={!!user}
              isAdmin={isAdmin}
            />

            {user && (
              <Link
                href="/dashboard/cars/add"
                className="sell-button"
              >
                Sell Your Car
              </Link>
            )}
          </div>
        </header>

        {children}

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={`${styles.footerBrand} ${styles.footerReveal}`}>
              <p className={styles.footerWordmark}>Motoraq</p>
              <p className={styles.footerTagline}>
                A modern marketplace for buying and selling cars.
              </p>
              <Link className={styles.footerCta} href={sellHref}>
                Sell your car
              </Link>
            </div>

            <nav
              className={`${styles.footerColumn} ${styles.footerReveal}`}
              aria-label="Explore"
            >
              <h2 className={styles.footerHeading}>Explore</h2>
              <ul className={styles.footerList}>
                <li>
                  <Link className={styles.footerLink} href="/cars">
                    Browse cars
                  </Link>
                </li>
                <li>
                  <Link className={styles.footerLink} href={sellHref}>
                    Sell your car
                  </Link>
                </li>
              </ul>
            </nav>

            <nav
              className={`${styles.footerColumn} ${styles.footerReveal}`}
              aria-label="Account"
            >
              <h2 className={styles.footerHeading}>Account</h2>
              <ul className={styles.footerList}>
                {user ? (
                  <>
                    <li>
                      <Link className={styles.footerLink} href="/dashboard">
                        Dashboard
                      </Link>
                    </li>
                    {isAdmin && (
                      <li>
                        <Link className={styles.footerLink} href="/admin">
                          Admin
                        </Link>
                      </li>
                    )}
                  </>
                ) : (
                  <>
                    <li>
                      <Link className={styles.footerLink} href="/login">
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link className={styles.footerLink} href="/register">
                        Create account
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>

          <div className={styles.footerBottom}>
            <p className={styles.footerCopy}>
              © {new Date().getFullYear()} Motoraq. All rights reserved.
            </p>
            <p className={styles.footerCopy}>
              
            </p>
          </div>

          {/* Decoration only: a car drives along the road */}
          <div className={styles.footerRoad} aria-hidden="true">
            <span className={styles.footerCar}>
              <span className={styles.footerCarBody} />
              <span className={styles.footerCarCabin} />
              <span className={`${styles.footerCarWheel} ${styles.footerWheelA}`} />
              <span className={`${styles.footerCarWheel} ${styles.footerWheelB}`} />
              <span className={styles.footerCarLight} />
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}