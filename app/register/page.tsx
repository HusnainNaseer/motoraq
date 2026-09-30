"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./register.module.css";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // New: only controls if the password is shown as text
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      if (
        error.code === "user_already_exists" ||
        /already registered|already exists/i.test(error.message)
      ) {
        alert("This email is already registered. Please log in.");
        router.replace("/login");
        return;
      }

      alert(error.message);
      return;
    }

    if (data.user?.identities?.length === 0) {
      alert("This email is already registered. Please log in.");
      router.replace("/login");
      return;
    }

    alert("Registration successful!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.auth}>

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
      <section className={styles.scene} aria-label="Create a Motoraq account">
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
              <h1 className={styles.title}>Create Account</h1>
              <p className={styles.subtitle}>
                Join Motoraq to buy, sell and save cars.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleRegister}>
              <div className={`${styles.field} ${styles.rise} ${styles.d2}`}>
                <label className={styles.label} htmlFor="fullName">
                  Full name
                </label>

                <input
                  className={styles.input}
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className={`${styles.field} ${styles.rise} ${styles.d3}`}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>

                <input
                  className={styles.input}
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={`${styles.field} ${styles.rise} ${styles.d4}`}>
                <label className={styles.label} htmlFor="password">
                  Password
                </label>

                <div className={styles.passwordWrap}>
                  <input
                    className={`${styles.input} ${styles.passwordInput}`}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <button
                className={`${styles.button} ${styles.rise} ${styles.d5}`}
                type="submit"
              >
                Register
              </button>
            </form>

            <p className={`${styles.footerText} ${styles.rise} ${styles.d6}`}>
              Already have an account?{" "}
              <Link className={styles.link} href="/login">
                Login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}