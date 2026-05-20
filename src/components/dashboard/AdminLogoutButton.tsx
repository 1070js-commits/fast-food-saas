"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearEmployeeSessionLocal } from "@/lib/employee-session";
import { clearManagerSessionLocal } from "@/lib/manager-session";

export function AdminLogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearEmployeeSessionLocal();
    clearManagerSessionLocal();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-[#161922]/90 px-4 py-2 text-sm font-medium text-gray-200 backdrop-blur transition hover:border-[#ff6b35]/50 hover:text-white"
    >
      <LogOut size={16} />
      Se déconnecter
    </button>
  );
}
