import { Toaster } from "react-hot-toast";
import { DashboardSessionGuard } from "@/components/employe/DashboardSessionGuard";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { EmployeeChrome } from "@/components/employe/EmployeeChrome";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSessionGuard>
      <DashboardChrome />
      <EmployeeChrome />
      {children}
      <Toaster position="top-right" />
    </DashboardSessionGuard>
  );
}
