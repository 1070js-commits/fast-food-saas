"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "@/lib/access-context";

type OrderLineInput = {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
};

export async function createOrderAction(
  businessId: string,
  total: number,
  items: OrderLineInput[]
): Promise<{ orderId: string } | { error: string }> {
  const ctx = await getAccessContext();

  if (!ctx) {
    return { error: "Session expirée. Reconnectez-vous." };
  }

  if (ctx.businessId !== businessId) {
    return { error: "Accès refusé pour ce commerce." };
  }

  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      business_id: businessId,
      employee_id: ctx.type === "admin" ? ctx.userId : null,
      type: "counter",
      status: "en_attente",
      total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[caisse] createOrder error:", orderError);
    return {
      error: orderError?.message ?? "Impossible de créer la commande.",
    };
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    items.map((line) => ({
      order_id: order.id,
      menu_item_id: line.menuItemId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
    }))
  );

  if (itemsError) {
    console.error("[caisse] createOrder items error:", itemsError);
    return { error: itemsError.message };
  }

  return { orderId: order.id };
}
