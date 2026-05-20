"use client";

import { useRouter } from "next/navigation";
import { clearEmployeeSessionLocal } from "@/lib/employee-session";

export function EmployeeLockButton() {
  const router = useRouter();

  const lock = async () => {
    clearEmployeeSessionLocal();
    await fetch("/api/employe/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={lock}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-[#161922]/90 px-4 py-2 text-sm font-medium text-gray-200 backdrop-blur transition hover:border-[#ff6b35]/50 hover:text-white"
    >
      Verrouiller 🔒
    </button>
  );
}
