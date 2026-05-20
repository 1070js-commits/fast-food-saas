"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getEmployeeSessionLocal, isEmployeeAllowedPath } from "@/lib/employee-session";
import { getManagerSessionLocal } from "@/lib/manager-session";
import { AdminLogoutButton } from "./AdminLogoutButton";

export function DashboardChrome() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setShow(true);
        return;
      }
      if (getManagerSessionLocal()) {
        setShow(true);
        return;
      }
      if (getEmployeeSessionLocal() && isEmployeeAllowedPath(pathname)) {
        setShow(false);
        return;
      }
      setShow(true);
    });
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <AdminLogoutButton />
    </div>
  );
}
