"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  clearManagerSessionLocal,
  getManagerSessionLocal,
} from "@/lib/manager-session";

export function useManagerModuleGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return;

      const session = getManagerSessionLocal();
      if (!session) return;

      const msUntilExpiry = session.expiresAt - Date.now();
      if (msUntilExpiry <= 0) {
        clearManagerSessionLocal();
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
        return;
      }

      window.setTimeout(async () => {
        clearManagerSessionLocal();
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/");
      }, msUntilExpiry);
    };

    check();
  }, [router]);
}
