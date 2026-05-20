export const EMPLOYEE_SESSION_COOKIE = "employee_session";
export const EMPLOYEE_SESSION_STORAGE_KEY = "fastfood_employee_session";
export const EMPLOYEE_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export type EmployeeSession = {
  businessId: string;
  businessName: string;
  expiresAt: number;
};

export function encodeEmployeeSession(session: EmployeeSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function parseEmployeeSession(
  encoded: string | undefined | null
): EmployeeSession | null {
  if (!encoded) return null;
  try {
    const data = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as EmployeeSession;
    if (!data.businessId || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveEmployeeSessionLocal(session: EmployeeSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMPLOYEE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getEmployeeSessionLocal(): EmployeeSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(EMPLOYEE_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as EmployeeSession;
    if (!data.businessId || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) {
      clearEmployeeSessionLocal();
      return null;
    }
    return data;
  } catch {
    clearEmployeeSessionLocal();
    return null;
  }
}

export function clearEmployeeSessionLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMPLOYEE_SESSION_STORAGE_KEY);
}

export const EMPLOYEE_ALLOWED_PATHS = [
  "/dashboard/caisse",
  "/dashboard/cuisine",
  "/dashboard/stock",
] as const;

export function isEmployeeAllowedPath(pathname: string): boolean {
  return EMPLOYEE_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
