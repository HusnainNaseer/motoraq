"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ToggleResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string };

// Saves the car if it isn't saved yet, removes it if it is.
export async function toggleFavorite(carId: number): Promise<ToggleResult> {
  if (!Number.isInteger(carId) || carId <= 0) {
    return { ok: false, error: "Invalid listing." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Log in to save cars." };
  }

  // Try to remove first; if a row was removed, the car is now unsaved
  const { data: removed, error: removeError } = await supabase
    .from("favorites")
    .delete()
    .eq("car_id", carId)
    .eq("user_id", user.id)
    .select("car_id");

  if (removeError) {
    console.error("toggleFavorite remove failed:", removeError);
    return { ok: false, error: "Could not update your saved cars." };
  }

  if (removed && removed.length > 0) {
    revalidatePath("/dashboard/favorites");
    return { ok: true, saved: false };
  }

  // Nothing to remove, so save it. 23505 = already saved (double click).
  const { error: insertError } = await supabase
    .from("favorites")
    .insert({ car_id: carId, user_id: user.id });

  if (insertError && insertError.code !== "23505") {
    console.error("toggleFavorite insert failed:", insertError);
    return { ok: false, error: "Could not update your saved cars." };
  }

  revalidatePath("/dashboard/favorites");
  return { ok: true, saved: true };
}