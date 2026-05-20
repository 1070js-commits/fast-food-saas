import { redirect } from "next/navigation";
import { StockView } from "./components/StockView";
import type { Ingredient } from "@/types/stock";
import { getAccessContext } from "@/lib/access-context";
import { createAdminClient } from "@/lib/supabase/admin";

const INGREDIENT_SELECT =
  "id, business_id, name, unit, current_stock, min_stock, cost_per_unit";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  const supabase = createAdminClient();
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .select(INGREDIENT_SELECT)
    .eq("business_id", ctx.businessId)
    .order("name");

  if (ingredientsError) {
    console.error("[stock/page] ingredients", ingredientsError);
  }

  return (
    <StockView
      businessId={ctx.businessId}
      profileBusinessId={ctx.type === "admin" ? ctx.businessId : null}
      initialIngredients={(ingredients ?? []) as Ingredient[]}
    />
  );
}
