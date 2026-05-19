import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();
  if (!profile?.business_id) {
    return NextResponse.json({ error: "Business introuvable" }, { status: 400 });
  }

  // Récupère plats + recettes + ingrédients pour ce restaurant
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .eq("business_id", profile.business_id);

  const { data: recipes } = await supabase
    .from("recipes")
    .select("menu_item_id, quantity, ingredients(name, unit, cost_per_unit)")
    .in("menu_item_id", (items ?? []).map((i) => i.id));

  type R = {
    menu_item_id: string;
    quantity: number;
    ingredients: { name: string; unit: string; cost_per_unit: number } | null;
  };

  const summary = (items ?? []).map((item) => {
    const lines = ((recipes ?? []) as unknown as R[])
      .filter((r) => r.menu_item_id === item.id && r.ingredients);
    const cost = lines.reduce(
      (s, r) => s + Number(r.quantity) * Number(r.ingredients?.cost_per_unit ?? 0),
      0
    );
    return {
      name: item.name,
      price: Number(item.price),
      food_cost: Number(cost.toFixed(2)),
      margin_pct:
        Number(item.price) > 0
          ? Number((((Number(item.price) - cost) / Number(item.price)) * 100).toFixed(1))
          : 0,
      ingredients: lines.map((r) => ({
        name: r.ingredients?.name,
        quantity: Number(r.quantity),
        unit: r.ingredients?.unit,
      })),
    };
  });

  const analysis = await runAgent({
    system: `Tu es un expert en gestion de restaurant rapide. Tu analyses les food costs et les marges.
Réponds en français, en markdown.
Identifie : (1) les plats à marge trop faible (<60%),
(2) les plats à fort potentiel à mettre en avant,
(3) 3 actions concrètes pour améliorer la marge globale.
Sois bref, factuel, actionnable.`,
    user: `Voici les données du menu et coûts matière (JSON) :\n\n${JSON.stringify(summary, null, 2)}`,
    maxTokens: 1200,
  });

  return NextResponse.json({ summary, analysis });
}
