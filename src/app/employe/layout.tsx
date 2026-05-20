import { EmployeeSessionGuard } from "@/components/employe/EmployeeSessionGuard";
import { EmployeeChrome } from "@/components/employe/EmployeeChrome";

export default function EmployeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmployeeSessionGuard>
      <EmployeeChrome />
      {children}
    </EmployeeSessionGuard>
  );
}
