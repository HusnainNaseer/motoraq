import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.loadingPage}>
      <div className={styles.loader} role="status" aria-live="polite">
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

          <div className={styles.ring}>
            <div className={styles.ringSpin}></div>
          </div>
        </div>

        <h2>Loading Motoraq</h2>
        <p>Please wait...</p>
      </div>
    </main>
  );
}