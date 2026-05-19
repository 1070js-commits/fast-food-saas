"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

type Point = { date: string; revenue: number; orders: number };

export function RevenueChart({ days }: { days: number }) {
  const [data, setData] = useState<Point[] | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/analytics/revenue?days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d.series))
      .catch(() => setData([]));
  }, [days]);

  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), "d MMM", { locale: fr })}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: number) => `${v.toFixed(2)} €`}
            labelFormatter={(d) =>
              format(parseISO(d as string), "EEEE d MMMM", { locale: fr })
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#rev)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
