"use client";

import Link from "next/link";
import { CreditCard, ChefHat, Package } from "lucide-react";
import { getEmployeeSessionLocal } from "@/lib/employee-session";

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
    title: "Stock",
    description: "Inventaire et approvisionnement",
    icon: Package,
    href: "/dashboard/stock",
  },
];

export default function EmployeDashboardPage() {
  const session = getEmployeeSessionLocal();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f1117" }}>
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Espace employé</h1>
            <p className="mt-1 text-sm text-gray-400">
              {session?.businessName ?? "Commerce"}
            </p>
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
