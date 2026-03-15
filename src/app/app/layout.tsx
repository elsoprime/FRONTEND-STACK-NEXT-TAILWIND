import { BrowserSessionGuard } from "@/components/auth/browser-session-guard";
import { DashboardShell } from "@/components/tenant/dashboard-shell";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <BrowserSessionGuard>
      <DashboardShell>{children}</DashboardShell>
    </BrowserSessionGuard>
  );
}


