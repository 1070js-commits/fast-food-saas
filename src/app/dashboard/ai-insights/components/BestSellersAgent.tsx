"use client";

import { useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  units_sold: number;
  revenue: number;
};

export function BestSellersAgent() {
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(30);
  const [ranking, setRanking] = useState<Row[] | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/ai/best-sellers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRanking(data.ranking);
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
          <TrendingUp className="text-emerald-600" size={20} />
          <h2 className="font-semibold">Agent Best Sellers</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value={7}>7 j</option>
            <option value={30}>30 j</option>
            <option value={90}>90 j</option>
          </select>
          <button
            onClick={run}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {busy && <Loader2 className="animate-spin" size={14} />}
            {busy ? "Analyse..." : "Analyser"}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {ranking && (
          <ol className="space-y-2">
            {ranking.slice(0, 8).map((r, idx) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-xs flex items-center justify-center font-semibold">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{r.units_sold} u.</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(r.revenue)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
        {analysis && (
          <article className="prose prose-sm max-w-none whitespace-pre-wrap">
            {analysis}
          </article>
        )}
        {!ranking && !busy && (
          <p className="text-sm text-gray-400">
            Sélectionnez une période et cliquez sur « Analyser ».
          </p>
        )}
      </div>
    </div>
  );
}
