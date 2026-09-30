"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function addCar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("cars").insert({
    user_id: user.id,
    make: formData.get("make") as string,
    model: formData.get("model") as string,
    year: Number(formData.get("year")),
    price: Number(formData.get("price")),
    mileage: Number(formData.get("mileage")),
    fuel_type: formData.get("fuel_type") as string,
    transmission: formData.get("transmission") as string,
    location: formData.get("location") as string,
    description: formData.get("description") as string,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard/cars");
}

export async function deleteCar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const carId = Number(formData.get("carId"));

  const { error } = await supabase
    .from("cars")
    .delete()
    .eq("id", carId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard/cars");
}



export async function updateCar(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const carId = Number(formData.get("carId"));

  const { error } = await supabase
    .from("cars")
    .update({
      make: formData.get("make") as string,
      model: formData.get("model") as string,
      year: Number(formData.get("year")),
      price: Number(formData.get("price")),
      mileage: Number(formData.get("mileage")),
      fuel_type: formData.get("fuel_type") as string,
      transmission: formData.get("transmission") as string,
      location: formData.get("location") as string,
      description: formData.get("description") as string,
    })
    .eq("id", carId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard/cars");
}