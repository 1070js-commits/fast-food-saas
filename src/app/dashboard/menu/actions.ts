"use server";

import { ensureCategoryForBusiness } from "@/lib/business";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type MenuItemRow = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export async function loadMenuItemsAction(
  businessId: string
): Promise<{ items: MenuItemRow[] } | { error: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("menu_items")
    .select("id, name, price, category_id, categories(name)")
    .eq("business_id", businessId)
    .order("name");

  if (error) {
    console.error("[menu] loadMenuItemsAction error:", error);
    return { error: error.message };
  }

  const items: MenuItemRow[] = (data ?? []).map((row) => {
    const categories = row.categories as
      | { name: string }
      | { name: string }[]
      | null;
    let category = "Autres";
    if (categories) {
      category = Array.isArray(categories)
        ? (categories[0]?.name ?? "Autres")
        : categories.name;
    }
    return {
      id: row.id,
      name: row.name,
      price: Number(row.price),
      category,
    };
  });

  return { items };
}

export async function addMenuItemAction(input: {
  businessId: string;
  name: string;
  price: number;
  category: string;
  categoryEmoji?: string;
}): Promise<{ ok: true } | { error: string; details?: unknown }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const err = "Session expirée. Reconnectez-vous.";
    console.error("[menu] addMenuItemAction:", err);
    return { error: err };
  }

  const admin = createAdminClient();

  const categoryResult = await ensureCategoryForBusiness(
    admin,
    input.businessId,
    input.category,
    input.categoryEmoji
  );

  if ("error" in categoryResult) {
    console.error("[menu] ensureCategoryForBusiness error:", categoryResult.error);
    return { error: categoryResult.error };
  }

  const payload = {
    business_id: input.businessId,
    name: input.name.trim(),
    price: input.price,
    category_id: categoryResult.categoryId,
    is_available: true,
  };

  console.log("[menu] addMenuItemAction insert payload:", payload);

  const { data, error } = await admin
    .from("menu_items")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("[menu] addMenuItemAction insert error:", error);
    return { error: error.message, details: error };
  }

  console.log("[menu] addMenuItemAction success:", data);
  return { ok: true };
}
