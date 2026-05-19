import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FoodCostAgent } from "./components/FoodCostAgent";
import { BestSellersAgent } from "./components/BestSellersAgent";

export const dynamic = "force-dynamic";

export default async function AiInsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold">AI Insights</h1>
              <p className="text-sm text-gray-500">
                Analyses food cost et best sellers par Claude
              </p>
            </div>
          </div>
        </div>
      </header>

      <p className="text-sm text-gray-600 max-w-3xl">
        Deux agents Claude analysent vos données menu et ventes. Lancez une
        analyse pour obtenir des recommandations actionnables en français.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FoodCostAgent />
        <BestSellersAgent />
      </div>
    </div>
  );
}
