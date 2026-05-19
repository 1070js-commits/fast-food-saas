"use client";

import { useState } from "react";
import { ChefHat, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

type Summary = {
  name: string;
  price: number;
  food_cost: number;
  margin_pct: number;
};

export function FoodCostAgent() {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary[] | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai/food-cost", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data.summary);
      setAnalysis(data.analysis);
    } catch (e: any) {
      toast.error("Erreur agent : " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ChefHat className="text-orange-600" size={20} />
          <h2 className="font-semibold">Agent Food Cost</h2>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="animate-spin" size={14} />}
          {busy ? "Analyse..." : "Lancer l'analyse"}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {summary && (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-3 py-2">Plat</th>
                  <th className="px-3 py-2">Prix</th>
                  <th className="px-3 py-2">Coût</th>
                  <th className="px-3 py-2">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.map((s) => (
                  <tr key={s.name}>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{formatCurrency(s.price)}</td>
                    <td className="px-3 py-2">{formatCurrency(s.food_cost)}</td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        s.margin_pct < 60 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {s.margin_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {analysis && (
          <article className="prose prose-sm max-w-none whitespace-pre-wrap">
            {analysis}
          </article>
        )}
        {!summary && !busy && (
          <p className="text-sm text-gray-400">
            Cliquez sur « Lancer l&apos;analyse » pour calculer les food costs.
          </p>
        )}
      </div>
    </div>
  );
}
