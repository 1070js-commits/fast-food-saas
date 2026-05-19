import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subDays, format, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 14), 1), 90);
  const since = subDays(startOfDay(new Date()), days - 1);

  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .eq("business_id", profile.business_id)
    .gte("created_at", since.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // bucket par jour
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
    buckets.set(d, { revenue: 0, orders: 0 });
  }
  (data ?? []).forEach((o) => {
    if (o.status === "annule" || o.status === "cancelled") return;
    const d = format(new Date(o.created_at), "yyyy-MM-dd");
    const bucket = buckets.get(d);
    if (bucket) {
      bucket.revenue += Number(o.total);
      bucket.orders += 1;
    }
  });

  const series = Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    revenue: Number(v.revenue.toFixed(2)),
    orders: v.orders,
  }));

  const totalRevenue = series.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = series.reduce((s, r) => s + r.orders, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return NextResponse.json({
    series,
    kpis: {
      total_revenue: Number(totalRevenue.toFixed(2)),
      total_orders: totalOrders,
      avg_ticket: Number(avgTicket.toFixed(2)),
      days,
    },
  });
}
