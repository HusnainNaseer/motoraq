"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteAdminCar(
  formData: FormData
) {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const carId = Number(
    formData.get("carId")
  );

  const { error } = await supabase
    .from("cars")
    .delete()
    .eq("id", carId);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/cars");
}