"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée. Reconnectez-vous." };
  }

  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      business_id: businessId,
      employee_id: user.id,
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
