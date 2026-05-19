import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/anthropic";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const days: number = Math.min(Math.max(Number(body.days ?? 30), 1), 365);
  const since = subDays(new Date(), days).toISOString();

  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .eq("business_id", profile.business_id);

  const itemIds = (items ?? []).map((i) => i.id);
  if (itemIds.length === 0) {
    return NextResponse.json({
      ranking: [],
      analysis: "Aucun plat au menu.",
    });
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("menu_item_id, quantity, created_at, orders!inner(status, business_id)")
    .in("menu_item_id", itemIds)
    .gte("created_at", since);

  type Row = {
    menu_item_id: string;
    quantity: number;
    orders: { status: string; business_id: string }[] | { status: string; business_id: string };
  };

  const totals = new Map<string, number>();
  ((orderItems ?? []) as unknown as Row[]).forEach((r) => {
    totals.set(r.menu_item_id, (totals.get(r.menu_item_id) ?? 0) + Number(r.quantity));
  });

  const ranking = (items ?? [])
    .map((i) => ({
      id: i.id,
      name: i.name,
      price: Number(i.price),
      units_sold: totals.get(i.id) ?? 0,
      revenue: (totals.get(i.id) ?? 0) * Number(i.price),
    }))
    .sort((a, b) => b.units_sold - a.units_sold);

  const analysis = await runAgent({
    system: `Tu es un analyste de restauration rapide. À partir d'un classement de ventes sur ${days} jours, donne :
(1) le top 3 et ce qui les rend gagnants,
(2) les flops (ventes < 5 unités) et la décision à prendre (retirer / promouvoir / repenser),
(3) une suggestion de menu du jour ou combo pour booster les ventes.
Réponds en français, en markdown court et actionnable.`,
    user: `Classement (${days} derniers jours) :\n\n${JSON.stringify(ranking, null, 2)}`,
    maxTokens: 1200,
  });

  return NextResponse.json({ ranking, analysis, days });
}
