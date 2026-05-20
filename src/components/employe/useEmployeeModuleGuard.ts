"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  clearEmployeeSessionLocal,
  getEmployeeSessionLocal,
} from "@/lib/employee-session";

export function useEmployeeModuleGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return;

      const session = getEmployeeSessionLocal();
      if (!session) {
        router.replace("/");
        return;
      }

      const msUntilExpiry = session.expiresAt - Date.now();
      if (msUntilExpiry <= 0) {
        clearEmployeeSessionLocal();
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
        return;
      }

      window.setTimeout(async () => {
        clearEmployeeSessionLocal();
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
      }, msUntilExpiry);
    };

    check();
  }, [router]);
}
