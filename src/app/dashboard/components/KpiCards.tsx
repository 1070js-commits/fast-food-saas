"use client";

import { useEffect, useState } from "react";
import { Euro, ShoppingBag, Receipt, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Kpis = {
  total_revenue: number;
  total_orders: number;
  avg_ticket: number;
  days: number;
};

export function KpiCards({ days }: { days: number }) {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    setKpis(null);
    fetch(`/api/analytics/revenue?days=${days}`)
      .then((r) => r.json())
      .then((d) => setKpis(d.kpis))
      .catch(() => setKpis(null));
  }, [days]);

  const cards = [
    {
      label: "Chiffre d'affaires",
      value: kpis ? formatCurrency(kpis.total_revenue) : "—",
      Icon: Euro,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Commandes",
      value: kpis ? kpis.total_orders.toString() : "—",
      Icon: ShoppingBag,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Ticket moyen",
      value: kpis ? formatCurrency(kpis.avg_ticket) : "—",
      Icon: Receipt,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-white p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
            <c.Icon size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold">
              {kpis ? c.value : <Loader2 className="animate-spin" size={16} />}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
