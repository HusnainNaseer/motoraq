"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the real error in the console, but do not show it to visitors
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.errorPage}>
      <div className={styles.errorCard} role="alert">
        {/* Decorative scene, hidden from screen readers */}
        <div className={styles.stage} aria-hidden="true">
          <div className={styles.person}>
            <div className={styles.figure}>
              <span className={`${styles.arm} ${styles.armBack}`}></span>
              <span className={`${styles.leg} ${styles.legBack}`}></span>
              <span className={styles.body}></span>
              <span className={`${styles.leg} ${styles.legFront}`}></span>
              <span className={styles.head}></span>
              <span className={`${styles.arm} ${styles.armFront}`}></span>
            </div>
          </div>

          <div className={styles.ring}></div>
        </div>

        <h2>Something went wrong</h2>
        <p>We could not load this page. Please try again.</p>

        <div className={styles.actions}>
          <button type="button" className={styles.retryButton} onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" className={styles.homeLink}>
            Go to home
          </Link>
        </div>
      </div>
    </main>
  );
}