import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EMPLOYEE_SESSION_COOKIE,
  EMPLOYEE_SESSION_DURATION_MS,
  encodeEmployeeSession,
  type EmployeeSession,
} from "@/lib/employee-session";
import {
  MANAGER_SESSION_COOKIE,
  MANAGER_SESSION_DURATION_MS,
  encodeManagerSession,
  type ManagerSession,
} from "@/lib/manager-session";

export const dynamic = "force-dynamic";

type Role = "gerant" | "employe";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin ?? "").trim();
  const role = (body.role === "gerant" ? "gerant" : "employe") as Role;

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "Le code doit contenir 4 chiffres." },
      { status: 400 }
    );
  }

  const pinColumn = role === "gerant" ? "manager_pin" : "employee_pin";
  const admin = createAdminClient();
  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, name")
    .eq(pinColumn, pin);

  if (error) {
    console.error("[auth/verify-pin]", error);
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
  const response = NextResponse.json({
    role,
    businessId: business.id,
    businessName: business.name,
    expiresAt,
  });

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: EMPLOYEE_SESSION_DURATION_MS / 1000,
  };

  if (role === "gerant") {
    const session: ManagerSession = {
      businessId: business.id,
      businessName: business.name,
      expiresAt: Date.now() + MANAGER_SESSION_DURATION_MS,
    };
    response.cookies.set(
      MANAGER_SESSION_COOKIE,
      encodeManagerSession(session),
      { ...cookieOptions, maxAge: MANAGER_SESSION_DURATION_MS / 1000 }
    );
    response.cookies.set(EMPLOYEE_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  } else {
    const session: EmployeeSession = {
      businessId: business.id,
      businessName: business.name,
      expiresAt,
    };
    response.cookies.set(
      EMPLOYEE_SESSION_COOKIE,
      encodeEmployeeSession(session),
      cookieOptions
    );
    response.cookies.set(MANAGER_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  }

  return response;
}
