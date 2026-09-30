"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // New: only controls if the password is shown as text
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className={styles.loginPage}>

      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.floor} />
        <span className={styles.orbA} />
        <span className={styles.orbB} />
        <span className={styles.ring} />
        <span className={styles.ringInner} />
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
      <section className={styles.scene} aria-label="Login to Motoraq">
        {/* Decoration only: a person walks in and raises a hand */}
        <div className={styles.stage} aria-hidden="true">
          <span className={styles.brand}>Motoraq</span>
          <div className={styles.person}>
            <div className={styles.figure}>
              <span className={`${styles.leg} ${styles.legA}`} />
              <span className={`${styles.leg} ${styles.legB}`} />
              <span className={`${styles.arm} ${styles.armBack}`} />
              <span className={styles.body} />
              <span className={styles.head} />
              <span className={`${styles.arm} ${styles.armFront}`} />
              <span className={styles.orb} />
              <span className={styles.beam} />
            </div>
          </div>
        </div>

        <div className={styles.panelWrap}>
          <div className={styles.panel}>
            <div className={`${styles.rise} ${styles.d1}`}>
              <h1 className={styles.title}>Login to Motoraq</h1>
              <p className={styles.subtitle}>
                Sign in to buy, sell and save cars.
              </p>

              {redirectTo === "/dashboard/cars/add" && (
                <p className={styles.notice}>
                  Please login to sell your car.
                </p>
              )}
            </div>

            <form className={styles.form} onSubmit={handleLogin}>
              <div className={`${styles.field} ${styles.rise} ${styles.d2}`}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>

                <input
                  className={styles.input}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.rise} ${styles.d3}`}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>

                <div className={styles.passwordWrap}>
                  <input
                    className={`${styles.input} ${styles.passwordInput}`}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className={styles.toggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              <button
                className={`${styles.button} ${styles.rise} ${styles.d4}`}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>
            </form>

            <p className={`${styles.footerText} ${styles.rise} ${styles.d5}`}>
              New to Motoraq?{" "}
              <Link className={styles.link} href="/register">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}