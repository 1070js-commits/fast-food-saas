import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KpiCards } from "../components/KpiCards";
import { RevenueChart } from "../components/RevenueChart";
import { TopItemsChart } from "../components/TopItemsChart";
import { PeriodPicker } from "../components/PeriodPicker";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const days = Math.min(Math.max(Number(searchParams.days ?? 14), 1), 90);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md border bg-white p-2 hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord gérant</h1>
            <p className="text-sm text-gray-500">
              Vue synthétique de l&apos;activité — {days} derniers jours
            </p>
          </div>
        </div>
        <PeriodPicker current={days} />
      </header>

      <KpiCards days={days} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">Chiffre d&apos;affaires</h2>
          <RevenueChart days={days} />
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">Top plats</h2>
          <TopItemsChart days={days} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/ai-insights"
          className="rounded-lg border bg-white p-4 hover:border-purple-300"
        >
          <p className="font-semibold">Agents IA</p>
          <p className="text-sm text-gray-500">
            Analyse food cost et best sellers par Claude
          </p>
        </Link>
        <Link
          href="/dashboard/stock"
          className="rounded-lg border bg-white p-4 hover:border-amber-300"
        >
          <p className="font-semibold">Stock</p>
          <p className="text-sm text-gray-500">
            Ingrédients, alertes et réceptions
          </p>
        </Link>
        <Link
          href="/dashboard/recipes"
          className="rounded-lg border bg-white p-4 hover:border-emerald-300"
        >
          <p className="font-semibold">Recettes</p>
          <p className="text-sm text-gray-500">
            Composition des plats et déduction auto
          </p>
        </Link>
      </div>
    </div>
  );
}
