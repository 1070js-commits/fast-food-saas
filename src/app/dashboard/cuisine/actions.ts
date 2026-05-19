"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type KitchenOrderStatus = "en_attente" | "en_preparation" | "pret";

export async function updateOrderStatusAction(
  orderId: string,
  status: KitchenOrderStatus
): Promise<{ ok: true } | { error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée. Reconnectez-vous." };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("[cuisine] updateOrderStatus error:", error);
    return { error: error.message };
  }

  return { ok: true };
}
