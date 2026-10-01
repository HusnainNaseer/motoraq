import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { normalizePkPhone, formatPkPhone } from "@/lib/supabase/phone";

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
    <main>
      <h1>My Profile</h1>
      <p>Name: {profile?.full_name || "—"}</p>

      {saved && <p>Saved.</p>}
      {error === "phone" && (
        <p>Enter a valid Pakistani mobile number, like 0300 1234567.</p>
      )}
      {error === "save" && <p>Could not save. Please try again.</p>}

      <form action={save}>
        <label htmlFor="phone">Phone / WhatsApp number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="0300 1234567"
          defaultValue={profile?.phone ? formatPkPhone(profile.phone) : ""}
        />
        <p>Shown to logged-in buyers on your listings. Leave empty to hide it.</p>
        <button type="submit">Save</button>
      </form>
    </main>
  );
}