import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { TrackingClient } from "./TrackingClient";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("public_order_status")
    .select("*")
    .eq("public_token", params.token)
    .maybeSingle();

  if (!data) notFound();

  return <TrackingClient token={params.token} initial={data} />;
}
