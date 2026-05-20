import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_BUSINESS_ID } from "@/lib/active-business";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("name")
    .eq("id", FALLBACK_BUSINESS_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ name: "Restaurant" });
  }

  return NextResponse.json({ name: data?.name ?? "Restaurant" });
}
