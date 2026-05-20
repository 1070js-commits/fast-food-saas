import { NextResponse } from "next/server";
import { EMPLOYEE_SESSION_COOKIE } from "@/lib/employee-session";
import { MANAGER_SESSION_COOKIE } from "@/lib/manager-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(EMPLOYEE_SESSION_COOKIE, "", opts);
  response.cookies.set(MANAGER_SESSION_COOKIE, "", opts);
  return response;
}
