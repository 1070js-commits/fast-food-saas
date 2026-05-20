"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const INGREDIENT_SELECT =
  "id, business_id, name, unit, current_stock, min_stock, cost_per_unit";

export function AddIngredientButton({
  businessId,
  onAdded,
}: {
  businessId: string;
  onAdded?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  const submit = async (formData: FormData) => {
    setBusy(true);
    const payload = {
      business_id: businessId,
      name: String(formData.get("name") ?? "").trim(),
      unit: String(formData.get("unit") ?? "g"),
      current_stock: Number(formData.get("current_stock") ?? 0),
      min_stock: Number(formData.get("min_stock") ?? 0),
      cost_per_unit: Number(formData.get("cost_per_unit") ?? 0),
    };

    const { error } = await supabase.from("ingredients").insert(payload);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Ingrédient ajouté");
    setOpen(false);
    await onAdded?.();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
      >
        <Plus size={16} /> Ajouter un ingrédient
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <form
            action={submit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg bg-white p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold">Nouvel ingrédient</h2>
            <div className="space-y-3">
              <input
                name="name"
                placeholder="Nom (ex : Steak haché 150g)"
                required
                className="w-full rounded border px-3 py-2"
              />
              <div className="grid grid-cols-2 gap-3">
                <select name="unit" className="rounded border px-3 py-2">
                  <option value="g">grammes</option>
                  <option value="kg">kilos</option>
                  <option value="ml">ml</option>
                  <option value="l">litres</option>
                  <option value="cl">cl</option>
                  <option value="piece">pièce</option>
                </select>
                <input
                  name="cost_per_unit"
                  type="number"
                  step="0.01"
                  placeholder="Coût unitaire (€)"
                  className="rounded border px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="current_stock"
                  type="number"
                  step="0.001"
                  placeholder="Stock initial"
                  className="rounded border px-3 py-2"
                />
                <input
                  name="min_stock"
                  type="number"
                  step="0.001"
                  placeholder="Seuil mini"
                  className="rounded border px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border px-3 py-2 text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {busy ? "..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
