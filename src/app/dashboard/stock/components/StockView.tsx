"use client";

import { useCallback, useState } from "react";
import type { Ingredient } from "@/types/stock";
import { createClient } from "@/lib/supabase/client";
import { StockTable } from "./StockTable";
import { AddIngredientButton } from "./AddIngredientButton";
import { AlertTriangle } from "lucide-react";

// TODO: retirer après test — business_id en dur
const TEST_BUSINESS_ID = "fef05996-6b89-41d8-8aad-8c5d2d6718be";

const INGREDIENT_SELECT =
  "id, business_id, name, unit, current_stock, min_stock, cost_per_unit";

type StockViewProps = {
  businessId: string;
  profileBusinessId: string | null;
  initialIngredients: Ingredient[];
};

export function StockView({
  businessId,
  profileBusinessId,
  initialIngredients,
}: StockViewProps) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const supabase = createClient();
  const queryBusinessId = TEST_BUSINESS_ID;

  const reloadIngredients = useCallback(async () => {
    console.log("[stock/StockView] reloadIngredients", {
      businessIdProp: businessId,
      profileBusinessId,
      queryBusinessId,
    });

    const { data, error } = await supabase
      .from("ingredients")
      .select(INGREDIENT_SELECT)
      .eq("business_id", queryBusinessId)
      .order("name");

    console.log("[stock/StockView] reloadIngredients result", {
      error: error?.message ?? null,
      errorDetails: error,
      count: data?.length ?? 0,
      data,
    });

    if (error) {
      console.error("[stock/StockView] reload failed", error);
      return;
    }

    setIngredients((data ?? []) as Ingredient[]);
  }, [businessId, profileBusinessId, queryBusinessId]);

  const lowStock = ingredients.filter(
    (i) => Number(i.current_stock) <= Number(i.min_stock)
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion du stock</h1>
          <p className="text-sm text-gray-500">
            {ingredients.length} ingrédients suivis
          </p>
        </div>
        <AddIngredientButton
          businessId={businessId}
          onAdded={reloadIngredients}
        />
      </header>

      {lowStock.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-amber-900">
              {lowStock.length} ingrédient(s) en stock bas
            </p>
            <p className="text-sm text-amber-800">
              {lowStock.map((i) => i.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <StockTable ingredients={ingredients} setIngredients={setIngredients} />
    </div>
  );
}