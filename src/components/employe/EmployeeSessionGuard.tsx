"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getEmployeeSessionLocal } from "@/lib/employee-session";

export function EmployeeSessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getEmployeeSessionLocal();
    if (!session) {
      router.replace("/");
      return;
    }
    setReady(true);

    const msUntilExpiry = session.expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      router.replace("/");
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace("/");
    }, msUntilExpiry);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "#0f1117" }}
      >
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  return <>{children}</>;
}
