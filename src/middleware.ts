import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  EMPLOYEE_SESSION_COOKIE,
  isEmployeeAllowedPath,
  parseEmployeeSession,
} from "@/lib/employee-session";
import {
  MANAGER_SESSION_COOKIE,
  parseManagerSession,
} from "@/lib/manager-session";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const employeeSession = parseEmployeeSession(
    request.cookies.get(EMPLOYEE_SESSION_COOKIE)?.value
  );
  const managerSession = parseManagerSession(
    request.cookies.get(MANAGER_SESSION_COOKIE)?.value
  );

  if (pathname.startsWith("/dashboard")) {
    if (user || managerSession) {
      return response;
    }

    if (employeeSession && isEmployeeAllowedPath(pathname)) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = employeeSession ? "/employe/dashboard" : "/";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/employe/dashboard" && !employeeSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employe/dashboard",
    "/login",
    "/register",
  ],
};
