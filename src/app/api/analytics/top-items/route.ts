import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subDays } from "date-fns";

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
  const since = subDays(new Date(), days);

  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .eq("business_id", profile.business_id);

  const itemIds = (items ?? []).map((i) => i.id);
  if (itemIds.length === 0) return NextResponse.json({ items: [] });

  const { data: lines } = await supabase
    .from("order_items")
    .select("menu_item_id, quantity, created_at")
    .in("menu_item_id", itemIds)
    .gte("created_at", since.toISOString());

  const totals = new Map<string, number>();
  (lines ?? []).forEach((l) => {
    totals.set(
      l.menu_item_id,
      (totals.get(l.menu_item_id) ?? 0) + Number(l.quantity)
    );
  });

  const ranking = (items ?? [])
    .map((i) => ({
      id: i.id,
      name: i.name,
      qty: totals.get(i.id) ?? 0,
      revenue: Number(((totals.get(i.id) ?? 0) * Number(i.price)).toFixed(2)),
    }))
    .filter((r) => r.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  return NextResponse.json({ items: ranking, days });
}
