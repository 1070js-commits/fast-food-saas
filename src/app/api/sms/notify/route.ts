import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, buildTrackingUrl, smsTemplate } from "@/lib/twilio";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id } = (await request.json()) as { order_id: string };
  if (!order_id) return NextResponse.json({ error: "order_id requis" }, { status: 400 });

  const admin = createAdminClient();

  const { data: ticket, error } = await admin
    .from("order_tickets")
    .select(
      "id, ticket_number, public_token, customer_phone, sms_notified_at, order_id, orders(business_id, businesses(name))"
    )
    .eq("order_id", order_id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }
  if (!ticket.customer_phone) {
    return NextResponse.json(
      { error: "Aucun numéro client sur la commande" },
      { status: 400 }
    );
  }

  // Récup nom business via la jointure (Supabase peut renvoyer un objet ou un tableau)
  const ordersJoin = (ticket as any).orders;
  const businessName =
    Array.isArray(ordersJoin)
      ? ordersJoin[0]?.businesses?.name ?? "votre commerce"
      : ordersJoin?.businesses?.name ?? "votre commerce";

  try {
    const trackingUrl = buildTrackingUrl(ticket.public_token);
    const body = smsTemplate({
      ticketNumber: ticket.ticket_number,
      restaurantName: businessName,
      trackingUrl,
    });
    const { sid } = await sendSms({ to: ticket.customer_phone, body });

    await admin
      .from("order_tickets")
      .update({ sms_notified_at: new Date().toISOString() })
      .eq("id", ticket.id);

    return NextResponse.json({ ok: true, sid, body });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
