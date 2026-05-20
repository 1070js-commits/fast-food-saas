import { getEmployeeSessionLocal } from "@/lib/employee-session";

/** Fallback tant que le commerce n'est pas résolu côté client pour l'admin. */
export const FALLBACK_BUSINESS_ID = "fef05996-6b89-41d8-8aad-8c5d2d6718be";

export function getClientBusinessId(): string {
  const session = getEmployeeSessionLocal();
  return session?.businessId ?? FALLBACK_BUSINESS_ID;
}
