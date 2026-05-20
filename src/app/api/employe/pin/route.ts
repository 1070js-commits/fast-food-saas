import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  if (!profile?.business_id) {
    return NextResponse.json({ error: "Business introuvable" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: business, error } = await admin
    .from("businesses")
    .select("employee_pin, manager_pin")
    .eq("id", profile.business_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    hasEmployeePin: Boolean(business?.employee_pin),
    hasManagerPin: Boolean(business?.manager_pin),
  });
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  if (!profile?.business_id) {
    return NextResponse.json({ error: "Business introuvable" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "").trim();
  const type = body.type === "manager" ? "manager" : "employee";

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "Le code PIN doit contenir exactement 4 chiffres." },
      { status: 400 }
    );
  }

  const column = type === "manager" ? "manager_pin" : "employee_pin";
  const admin = createAdminClient();
  const { error } = await admin
    .from("businesses")
    .update({ [column]: pin })
    .eq("id", profile.business_id);

  if (error) {
    console.error("[employe/pin] update", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
