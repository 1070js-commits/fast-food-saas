import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Salaires from "./Salaires";

export const dynamic = "force-dynamic";

export default async function SalairesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  if (!profile?.business_id) {
    return <p className="p-8">Aucun business associé à votre compte.</p>;
  }

  const businessId = profile.business_id;

  const [{ data: employes }, { data: salaires }] = await Promise.all([
    supabase
      .from("employes")
      .select("id, nom, poste")
      .eq("business_id", businessId)
      .order("nom"),
    supabase
      .from("salaires")
      .select(
        "id, employe_id, montant, type_periode, date_debut, date_fin, notes, created_at"
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Salaires</h1>
        <p className="text-sm text-gray-500">
          Paiements mensuels ou hebdomadaires
        </p>
      </header>

      <Salaires
        businessId={businessId}
        employes={employes ?? []}
        initialSalaires={salaires ?? []}
      />
    </div>
  );
}
