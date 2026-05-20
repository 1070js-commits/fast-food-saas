"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getEmployeeSessionLocal, isEmployeeAllowedPath } from "@/lib/employee-session";
import { EmployeeLockButton } from "./EmployeeLockButton";

function isEmployeeSectionPath(pathname: string): boolean {
  return (
    pathname.startsWith("/employe") ||
    isEmployeeAllowedPath(pathname)
  );
}

export function EmployeeChrome() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isEmployeeSectionPath(pathname)) {
      setShow(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setShow(false);
        return;
      }
      setShow(Boolean(getEmployeeSessionLocal()));
    });
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <EmployeeLockButton />
    </div>
  );
}
