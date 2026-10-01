import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { normalizePkPhone, formatPkPhone } from "@/lib/supabase/phone";
import styles from "./profile.module.css";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  async function save(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const raw = String(formData.get("phone") ?? "").trim();
    const phone = raw === "" ? null : normalizePkPhone(raw);
    if (raw !== "" && !phone) redirect("/dashboard/profile?error=phone");

    const { error } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", user.id);

    if (error) {
      console.error("profile save failed:", error);
      redirect("/dashboard/profile?error=save");
    }
    redirect("/dashboard/profile?saved=1");
  }

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/dashboard">
        ← Back to Dashboard
      </Link>

      <div className={styles.header}>
        <h1>My Profile</h1>
        <p>Your contact details are shown to logged-in buyers on your listings.</p>
      </div>

      {saved && <p className={styles.success}>Saved.</p>}
      {error === "phone" && (
        <p className={styles.error}>
          Enter a valid Pakistani mobile number, like 0300 1234567.
        </p>
      )}
      {error === "save" && (
        <p className={styles.error}>Could not save. Please try again.</p>
      )}

      <div className={styles.card}>
        <div className={styles.row}>
          <span>Name</span>
          <strong>{profile?.full_name || "—"}</strong>
        </div>

        <form action={save}>
          <div className={styles.field}>
            <label htmlFor="phone">Phone / WhatsApp number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="0300 1234567"
              defaultValue={profile?.phone ? formatPkPhone(profile.phone) : ""}
            />
            <p className={styles.hint}>
              Buyers see Call and WhatsApp buttons on all your listings. Leave
              empty to hide your number.
            </p>
          </div>

          <button className={styles.button} type="submit">
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}