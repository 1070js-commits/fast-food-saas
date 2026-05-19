"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type MenuItem = { id: string; name: string; price: number };
type Ingredient = { id: string; name: string; unit: string; cost_per_unit: number };
type Recipe = {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity: number;
};

export function RecipeEditor({
  menuItems,
  ingredients,
  recipes: initialRecipes,
}: {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  recipes: Recipe[];
}) {
  const [selectedItem, setSelectedItem] = useState<string>(menuItems[0]?.id ?? "");
  const [recipes, setRecipes] = useState(initialRecipes);
  const supabase = createClient();

  const itemRecipes = useMemo(
    () => recipes.filter((r) => r.menu_item_id === selectedItem),
    [recipes, selectedItem]
  );

  const foodCost = useMemo(() => {
    return itemRecipes.reduce((sum, r) => {
      const ing = ingredients.find((i) => i.id === r.ingredient_id);
      return sum + (ing ? Number(ing.cost_per_unit) * Number(r.quantity) : 0);
    }, 0);
  }, [itemRecipes, ingredients]);

  const currentItem = menuItems.find((m) => m.id === selectedItem);
  const margin =
    currentItem && currentItem.price > 0
      ? ((Number(currentItem.price) - foodCost) / Number(currentItem.price)) * 100
      : 0;

  const addLine = async (ingredientId: string, quantity: number) => {
    if (!selectedItem || !ingredientId || !quantity) return;
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        menu_item_id: selectedItem,
        ingredient_id: ingredientId,
        quantity,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setRecipes((prev) => [...prev, data as Recipe]);
    toast.success("Ingrédient ajouté à la recette");
  };

  const removeLine = async (id: string) => {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  if (menuItems.length === 0) {
    return (
      <p className="text-gray-500">
        Ajoutez d&apos;abord des plats au menu pour pouvoir créer des recettes.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <aside className="lg:col-span-1 space-y-1">
        <h2 className="text-sm font-semibold uppercase text-gray-500 mb-2">
          Plats
        </h2>
        {menuItems.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedItem(m.id)}
            className={`block w-full text-left rounded px-3 py-2 text-sm ${
              selectedItem === m.id
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="flex justify-between">
              <span>{m.name}</span>
              <span className="text-xs opacity-75">
                {formatCurrency(Number(m.price))}
              </span>
            </div>
          </button>
        ))}
      </aside>

      <div className="lg:col-span-2 space-y-4">
        {currentItem && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Prix de vente</p>
              <p className="text-lg font-semibold">
                {formatCurrency(Number(currentItem.price))}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Coût matière</p>
              <p className="text-lg font-semibold">{formatCurrency(foodCost)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-gray-500">Marge brute</p>
              <p
                className={`text-lg font-semibold ${
                  margin < 60 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {margin.toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-2">Ingrédient</th>
                <th className="px-4 py-2">Quantité</th>
                <th className="px-4 py-2">Coût</th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {itemRecipes.map((r) => {
                const ing = ingredients.find((i) => i.id === r.ingredient_id);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{ing?.name ?? "—"}</td>
                    <td className="px-4 py-2">
                      {Number(r.quantity)} {ing?.unit}
                    </td>
                    <td className="px-4 py-2">
                      {formatCurrency(
                        (ing?.cost_per_unit ?? 0) * Number(r.quantity)
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => removeLine(r.id)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {itemRecipes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Aucun ingrédient pour ce plat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <AddLineForm ingredients={ingredients} onAdd={addLine} />
        </div>
      </div>
    </div>
  );
}

function AddLineForm({
  ingredients,
  onAdd,
}: {
  ingredients: Ingredient[];
  onAdd: (ingredientId: string, qty: number) => void;
}) {
  const [ingId, setIngId] = useState(ingredients[0]?.id ?? "");
  const [qty, setQty] = useState<string>("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(ingId, Number(qty));
        setQty("");
      }}
      className="flex items-center gap-2 p-3 border-t bg-gray-50"
    >
      <select
        value={ingId}
        onChange={(e) => setIngId(e.target.value)}
        className="flex-1 rounded border px-2 py-1 text-sm"
      >
        {ingredients.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} ({i.unit})
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.001"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Quantité"
        className="w-32 rounded border px-2 py-1 text-sm"
        required
      />
      <button
        type="submit"
        className="inline-flex items-center gap-1 rounded bg-black px-3 py-1 text-sm text-white"
      >
        <Plus size={14} /> Ajouter
      </button>
    </form>
  );
}
