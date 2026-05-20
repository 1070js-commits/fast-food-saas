import { Toaster } from "react-hot-toast";
import { DashboardSessionGuard } from "@/components/employe/DashboardSessionGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSessionGuard>
      {children}
      <Toaster position="top-right" />
    </DashboardSessionGuard>
  );
}
