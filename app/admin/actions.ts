"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteAdminCar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const carId = Number(formData.get("carId"));

  if (!Number.isInteger(carId) || carId <= 0) {
    redirect("/admin/cars");
  }

  // Read the photo paths first, because the rows may disappear with the car
  const { data: images } = await supabase
    .from("car_images")
    .select("image_url")
    .eq("car_id", carId);

  const { data: deleted, error } = await supabase
    .from("cars")
    .delete()
    .eq("id", carId)
    .select("id");

  if (error) {
    console.error("deleteAdminCar failed:", error);
    throw new Error("Could not delete the listing. Please try again.");
  }

  if (!deleted || deleted.length === 0) {
    throw new Error("Nothing was deleted. The listing may already be gone.");
  }

  // Remove the photo files so Storage doesn't fill up with orphans
  if (images && images.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("car-images")
      .remove(images.map((image) => image.image_url));

    if (storageError) {
      console.error("Photo cleanup failed:", storageError);
    }
  }

  redirect("/admin/cars");
}