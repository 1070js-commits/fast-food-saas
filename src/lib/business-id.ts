// TODO: retirer après test — business_id en dur
export const TEST_BUSINESS_ID = "fef05996-6b89-41d8-8aad-8c5d2d6718be";

export function resolveBusinessId(profileBusinessId: string | null | undefined) {
  return TEST_BUSINESS_ID || profileBusinessId || null;
}
