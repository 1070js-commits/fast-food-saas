import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("public_order_status")
    .select("*")
    .eq("public_token", params.token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  return NextResponse.json(data);
}
