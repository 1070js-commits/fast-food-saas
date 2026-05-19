import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordReception } from "@/lib/stock";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { ingredient_id, quantity } = body as {
    ingredient_id: string;
    quantity: number;
  };

  if (!ingredient_id || typeof quantity !== "number" || quantity <= 0) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    await recordReception(ingredient_id, quantity, user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
