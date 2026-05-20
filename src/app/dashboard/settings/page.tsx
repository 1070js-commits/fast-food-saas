import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmployeePinSettings } from "./components/EmployeePinSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0f1117" }}>
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:bg-[#161922]"
            aria-label="Retour"
          >
            <ArrowLeft size={16} />
          </Link>
          <Settings className="text-[#ff6b35]" size={22} />
          <div>
            <h1 className="text-2xl font-bold text-white">Paramètres</h1>
            <p className="text-sm text-gray-400">Configuration du commerce</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <EmployeePinSettings />
      </main>
    </div>
  );
}
