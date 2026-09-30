"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./layout.module.css";

type NavigationProps = {
  isAdmin: boolean;
  isLoggedIn: boolean;
};

export default function Navigation({
  isAdmin,
  isLoggedIn,
}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  let activePage = "";

  if (pathname === "/") {
    activePage = "home";
  } else if (pathname === "/login") {
    activePage = "login";
  } else if (pathname === "/register") {
    activePage = "register";
  } else if (pathname.startsWith("/cars")) {
    activePage = "marketplace";
  } else if (pathname === "/dashboard") {
    activePage = "dashboard";
  } else if (pathname === "/dashboard/cars") {
    activePage = "myCars";
  } else if (pathname === "/dashboard/cars/add") {
    activePage = "sellCar";
  } else if (pathname.startsWith("/dashboard/cars/")) {
    activePage = "myCars";
  } else if (pathname.startsWith("/admin")) {
    activePage = "admin";
  }

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <>
    <nav
      className="nav-links"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        aria-current={activePage === "home" ? "page" : undefined}
        className={
          activePage === "home"
            ? styles.activeNav
            : undefined
        }
      >
        Home
      </Link>

      <Link
        href="/cars"
        aria-current={activePage === "marketplace" ? "page" : undefined}
        className={
          activePage === "marketplace"
            ? styles.activeNav
            : undefined
        }
      >
        Browse Cars
      </Link>

      {isLoggedIn && (
        <Link
          href="/dashboard"
          aria-current={activePage === "dashboard" ? "page" : undefined}
          className={
            activePage === "dashboard"
              ? styles.activeNav
              : undefined
          }
        >
          Dashboard
        </Link>
      )}

      {isLoggedIn && (
        <Link
          href="/dashboard/cars"
          aria-current={activePage === "myCars" ? "page" : undefined}
          className={
            activePage === "myCars"
              ? styles.activeNav
              : undefined
          }
        >
          My Cars
        </Link>
      )}

      {isAdmin && (
        <Link
          href="/admin"
          aria-current={activePage === "admin" ? "page" : undefined}
          className={
            activePage === "admin"
              ? styles.activeNav
              : undefined
          }
        >
          Admin Panel
        </Link>
      )}

      {!isLoggedIn && (
        <>
          <Link
            href="/login"
            aria-current={activePage === "login" ? "page" : undefined}
            className={
              activePage === "login"
                ? styles.activeNav
                : undefined
            }
          >
            Login
          </Link>

          <Link
            href="/register"
            aria-current={activePage === "register" ? "page" : undefined}
            className={
              activePage === "register"
                ? styles.activeNav
                : undefined
            }
          >
            Register
          </Link>
        </>
      )}

      {isLoggedIn && (
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </nav>
    {isLoggedIn && (
      <Link
        href="/dashboard/cars/add"
        className={`sell-button${
          activePage === "sellCar" ? ` ${styles.activeSellButton}` : ""
        }`}
        aria-current={activePage === "sellCar" ? "page" : undefined}
      >
        Sell Your Car
      </Link>
    )}
    </>
  );
}