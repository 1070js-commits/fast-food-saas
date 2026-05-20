import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EMPLOYEE_SESSION_COOKIE,
  EMPLOYEE_SESSION_DURATION_MS,
  encodeEmployeeSession,
  type EmployeeSession,
} from "@/lib/employee-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "").trim();

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "Le code doit contenir 4 chiffres." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, name, employee_pin")
    .eq("employee_pin", pin);

  if (error) {
    console.error("[employe/verify-pin]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!businesses?.length) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }

  if (businesses.length > 1) {
    return NextResponse.json(
      { error: "Code ambigu. Contactez l'administrateur." },
      { status: 409 }
    );
  }

  const business = businesses[0];
  const expiresAt = Date.now() + EMPLOYEE_SESSION_DURATION_MS;
  const session: EmployeeSession = {
    businessId: business.id,
    businessName: business.name,
    expiresAt,
  };

  const response = NextResponse.json({
    businessId: business.id,
    businessName: business.name,
    expiresAt,
  });

  response.cookies.set(EMPLOYEE_SESSION_COOKIE, encodeEmployeeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: EMPLOYEE_SESSION_DURATION_MS / 1000,
  });

  return response;
}
