export const MANAGER_SESSION_COOKIE = "manager_session";
export const MANAGER_SESSION_STORAGE_KEY = "fastfood_manager_session";
export const MANAGER_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export type ManagerSession = {
  businessId: string;
  businessName: string;
  expiresAt: number;
};

export function encodeManagerSession(session: ManagerSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function parseManagerSession(
  encoded: string | undefined | null
): ManagerSession | null {
  if (!encoded) return null;
  try {
    const data = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as ManagerSession;
    if (!data.businessId || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveManagerSessionLocal(session: ManagerSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MANAGER_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getManagerSessionLocal(): ManagerSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MANAGER_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as ManagerSession;
    if (!data.businessId || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) {
      clearManagerSessionLocal();
      return null;
    }
    return data;
  } catch {
    clearManagerSessionLocal();
    return null;
  }
}

export function clearManagerSessionLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MANAGER_SESSION_STORAGE_KEY);
}
