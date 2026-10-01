// lib/auth/session.ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// cache() = one auth + profile lookup per request, shared by header, footer, page, actions
export const getViewer = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false } as const;

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();

  return { user, isAdmin: profile?.role === "admin" } as const;
});

export async function requireUser(next = "/dashboard") {
  const { user } = await getViewer();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const { user, isAdmin } = await getViewer();
  if (!user) redirect("/login?redirect=/admin");
  if (!isAdmin) redirect("/");
  return user;
}