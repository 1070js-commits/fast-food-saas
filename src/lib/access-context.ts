import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  EMPLOYEE_SESSION_COOKIE,
  parseEmployeeSession,
} from "@/lib/employee-session";
import {
  MANAGER_SESSION_COOKIE,
  parseManagerSession,
} from "@/lib/manager-session";

export type AccessContext =
  | { type: "admin"; businessId: string; userId: string }
  | { type: "manager"; businessId: string }
  | { type: "employee"; businessId: string };

export async function getAccessContext(): Promise<AccessContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();

    if (profile?.business_id) {
      return { type: "admin", businessId: profile.business_id, userId: user.id };
    }
  }

  const cookieStore = cookies();
  const managerSession = parseManagerSession(
    cookieStore.get(MANAGER_SESSION_COOKIE)?.value
  );
  if (managerSession) {
    return { type: "manager", businessId: managerSession.businessId };
  }

  const employeeSession = parseEmployeeSession(
    cookieStore.get(EMPLOYEE_SESSION_COOKIE)?.value
  );
  if (employeeSession) {
    return { type: "employee", businessId: employeeSession.businessId };
  }

  return null;
}
