import Link from "next/link";
import {
  CreditCard,
  ChefHat,
  LayoutDashboard,
  Package,
  Sparkles,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access-context";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  MANAGER_SESSION_COOKIE,
  parseManagerSession,
} from "@/lib/manager-session";

const modules = [
  {
    title: "Caisse",
    description: "Encaissement et commandes",
    icon: CreditCard,
    href: "/dashboard/caisse",
  },
  {
    title: "Cuisine",
    description: "File de préparation",
    icon: ChefHat,
    href: "/dashboard/cuisine",
  },
  {
    title: "Dashboard",
    description: "Statistiques et ventes",
    icon: LayoutDashboard,
    href: "/dashboard/stats",
  },
  {
    title: "Stock",
    description: "Inventaire et approvisionnement",
    icon: Package,
    href: "/dashboard/stock",
  },
  {
    title: "Clients",
    description: "Fidélité et historique",
    icon: Users,
    href: "/dashboard/clients",
  },
  {
    title: "Menu",
    description: "Produits et catégories",
    icon: UtensilsCrossed,
    href: "/dashboard/menu",
  },
  {
    title: "AI Insights",
    description: "Food cost et best sellers (Claude)",
    icon: Sparkles,
    href: "/dashboard/ai-insights",
  },
  {
    title: "Paramètres",
    description: "PIN employé et configuration",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export default async function DashboardPage() {
  const ctx = await getAccessContext();

  if (!ctx || ctx.type === "employee") {
    redirect("/");
  }

  let displayName = "Gérant";

  if (ctx.type === "admin") {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    displayName =
      user?.user_metadata?.full_name ??
      user?.user_metadata?.business_name ??
      user?.email ??
      "Administrateur";
  } else {
    const managerSession = parseManagerSession(
      cookies().get(MANAGER_SESSION_COOKIE)?.value
    );
    displayName = managerSession?.businessName ?? "Gérant";
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f1117" }}>
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">FastFood SaaS</h1>
            <p className="mt-1 text-sm text-gray-400">Bienvenue, {displayName}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-2 text-lg font-semibold text-white">Modules</h2>
        <p className="mb-8 text-sm text-gray-400">
          Sélectionnez un module pour commencer
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className="group rounded-2xl border border-gray-800 bg-[#161922] p-6 transition hover:border-[#ff6b35]/50 hover:bg-[#1a1e28]"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "#ff6b35" }} />
                </div>
                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-[#ff6b35]">
                  {mod.title}
                </h3>
                <p className="mt-1 text-sm text-gray-400">{mod.description}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
