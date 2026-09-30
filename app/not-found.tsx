import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.notFoundPage}>
      <div className={styles.notFoundCard}>
        {/* Decorative scene, hidden from screen readers */}
        <div className={styles.stage} aria-hidden="true">
          <div className={styles.bay}>404</div>

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
        </div>

        <h2>Page not found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>

        <div className={styles.actions}>
          <Link href="/cars" className={styles.browseLink}>
            Browse cars
          </Link>
          <Link href="/" className={styles.homeLink}>
            Go to home
          </Link>
        </div>
      </div>
    </main>
  );
}