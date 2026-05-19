import { createClient } from "@/lib/supabase/server";
import type { Ingredient, LowStockAlert, StockMovement } from "@/types/stock";

export async function listIngredients(businessId: string): Promise<Ingredient[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("business_id", businessId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listLowStock(businessId: string): Promise<LowStockAlert[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("low_stock_alerts")
    .select("*")
    .eq("business_id", businessId);
  if (error) throw error;
  return data ?? [];
}

export async function recordReception(
  ingredientId: string,
  quantity: number,
  userId?: string
): Promise<void> {
  const supabase = createClient();

  const { data: ingredient, error: fetchErr } = await supabase
    .from("ingredients")
    .select("current_stock")
    .eq("id", ingredientId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error: updateErr } = await supabase
    .from("ingredients")
    .update({
      current_stock: Number(ingredient.current_stock) + quantity,
    })
    .eq("id", ingredientId);
  if (updateErr) throw updateErr;

  const { error: logErr } = await supabase.from("stock_movements").insert({
    ingredient_id: ingredientId,
    delta: quantity,
    reason: "reception",
    user_id: userId ?? null,
  });
  if (logErr) throw logErr;
}

export async function recordAdjustment(
  ingredientId: string,
  delta: number,
  reason: "adjustment" | "loss",
  userId?: string
): Promise<void> {
  const supabase = createClient();
  const { data: ingredient, error: fetchErr } = await supabase
    .from("ingredients")
    .select("current_stock")
    .eq("id", ingredientId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error: updateErr } = await supabase
    .from("ingredients")
    .update({
      current_stock: Number(ingredient.current_stock) + delta,
    })
    .eq("id", ingredientId);
  if (updateErr) throw updateErr;

  const { error: logErr } = await supabase.from("stock_movements").insert({
    ingredient_id: ingredientId,
    delta,
    reason,
    user_id: userId ?? null,
  });
  if (logErr) throw logErr;
}

export async function listMovements(
  ingredientId: string,
  limit = 50
): Promise<StockMovement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("ingredient_id", ingredientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
