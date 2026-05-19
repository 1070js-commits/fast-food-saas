import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StockView } from "./components/StockView";
import type { Ingredient } from "@/types/stock";

// TODO: retirer après test — business_id en dur
const TEST_BUSINESS_ID = "fef05996-6b89-41d8-8aad-8c5d2d6718be";

const INGREDIENT_SELECT =
  "id, business_id, name, unit, current_stock, min_stock, cost_per_unit";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  console.log("[stock/page] profile", {
    userId: user.id,
    profile,
    profileError: profileError?.message ?? null,
    profileBusinessId: profile?.business_id ?? null,
    testBusinessId: TEST_BUSINESS_ID,
  });

  const businessId = TEST_BUSINESS_ID;

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .select(INGREDIENT_SELECT)
    .eq("business_id", businessId)
    .order("name");

  console.log("[stock/page] ingredients load", {
    businessId,
    count: ingredients?.length ?? 0,
    error: ingredientsError?.message ?? null,
    ingredientsError,
  });

  if (!profile?.business_id && !TEST_BUSINESS_ID) {
    return <p className="p-8">Aucun business associé à votre compte.</p>;
  }

  return (
    <StockView
      businessId={businessId}
      profileBusinessId={profile?.business_id ?? null}
      initialIngredients={(ingredients ?? []) as Ingredient[]}
    />
  );
}
