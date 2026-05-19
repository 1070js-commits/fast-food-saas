"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { Ingredient } from "@/types/stock";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Plus, Minus, Trash2 } from "lucide-react";

export function StockTable({
  ingredients,
  setIngredients,
}: {
  ingredients: Ingredient[];
  setIngredients: Dispatch<SetStateAction<Ingredient[]>>;
}) {
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (id: string, name: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    toast.success(`« ${name} » supprimé`);
  };

  const adjust = async (id: string, delta: number) => {
    const ingredient = ingredients.find((i) => i.id === id);
    if (!ingredient) return;
    const newStock = Number(ingredient.current_stock) + delta;
    const { error } = await supabase
      .from("ingredients")
      .update({ current_stock: newStock })
      .eq("id", id);

    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }

    await supabase.from("stock_movements").insert({
      ingredient_id: id,
      delta,
      reason: delta > 0 ? "reception" : "adjustment",
    });

    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, current_stock: newStock } : i))
    );
    toast.success("Stock mis à jour");
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-4 py-3">Ingrédient</th>
            <th className="px-4 py-3">Stock actuel</th>
            <th className="px-4 py-3">Seuil min</th>
            <th className="px-4 py-3">Coût unit.</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ingredients.map((i) => {
            const low = Number(i.current_stock) <= Number(i.min_stock);
            return (
              <tr key={i.id} className={cn(low && "bg-amber-50")}>
                <td className="px-4 py-3 font-medium">{i.name}</td>
                <td className="px-4 py-3">
                  <span className={cn("font-semibold", low && "text-amber-700")}>
                    {Number(i.current_stock).toFixed(2)} {i.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {Number(i.min_stock).toFixed(2)} {i.unit}
                </td>
                <td className="px-4 py-3">
                  {formatCurrency(Number(i.cost_per_unit))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => adjust(i.id, -1)}
                      className="p-1.5 rounded border hover:bg-gray-100"
                      aria-label="Retirer 1"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => adjust(i.id, 1)}
                      className="p-1.5 rounded border hover:bg-gray-100"
                      aria-label="Ajouter 1"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => remove(i.id, i.name)}
                      disabled={deletingId === i.id}
                      className="p-1.5 rounded border text-red-600 hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {ingredients.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                Aucun ingrédient. Cliquez sur « Ajouter » pour commencer.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
