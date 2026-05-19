import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecipeEditor } from "./components/RecipeEditor";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  if (!profile?.business_id) {
    return <p className="p-8">Aucun business associé.</p>;
  }

  const [menuItemsRes, ingredientsRes, recipesRes] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, price")
      .eq("business_id", profile.business_id)
      .order("name"),
    supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit")
      .eq("business_id", profile.business_id)
      .order("name"),
    supabase
      .from("recipes")
      .select("id, menu_item_id, ingredient_id, quantity"),
  ]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Recettes</h1>
        <p className="text-sm text-gray-500">
          Définissez les ingrédients consommés par chaque plat. La déduction
          de stock se fait automatiquement à chaque vente.
        </p>
      </header>

      <RecipeEditor
        menuItems={menuItemsRes.data ?? []}
        ingredients={ingredientsRes.data ?? []}
        recipes={recipesRes.data ?? []}
      />
    </div>
  );
}
