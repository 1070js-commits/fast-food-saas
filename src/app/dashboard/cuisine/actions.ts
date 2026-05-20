"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "@/lib/access-context";

export type KitchenOrderStatus = "en_attente" | "en_preparation" | "pret";

export async function updateOrderStatusAction(
  orderId: string,
  status: KitchenOrderStatus
): Promise<{ ok: true } | { error: string }> {
  const ctx = await getAccessContext();

  if (!ctx) {
    return { error: "Session expirée. Reconnectez-vous." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("business_id", ctx.businessId);

  if (error) {
    console.error("[cuisine] updateOrderStatus error:", error);
    return { error: error.message };
  }

  return { ok: true };
}
