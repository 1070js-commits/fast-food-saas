"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";

type Item = { id: string; name: string; qty: number; revenue: number };

export function TopItemsChart({ days }: { days: number }) {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    setItems(null);
    fetch(`/api/analytics/top-items?days=${days}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, [days]);

  if (!items) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 h-64 flex items-center justify-center">
        Aucune vente sur la période.
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 5, right: 10, bottom: 5, left: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={80}
          />
          <Tooltip formatter={(v: number) => `${v} unités`} />
          <Bar dataKey="qty" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
