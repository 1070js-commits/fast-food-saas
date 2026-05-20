import { NextResponse } from "next/server";
import { EMPLOYEE_SESSION_COOKIE } from "@/lib/employee-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(EMPLOYEE_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
