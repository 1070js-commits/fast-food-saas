"use client";

import type { ReactNode } from "react";
import { useManagerModuleGuard } from "./useManagerModuleGuard";

export function DashboardSessionGuard({ children }: { children: ReactNode }) {
  useManagerModuleGuard();
  return <>{children}</>;
}
