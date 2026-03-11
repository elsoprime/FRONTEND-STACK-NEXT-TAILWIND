import { BrowserSessionGuard } from "@/components/auth/browser-session-guard";
import { DashboardHeader } from "@/components/tenant/dashboard-header";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <BrowserSessionGuard>
      <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
        <DashboardHeader />
        <main className="flex-1">{children}</main>
      </div>
    </BrowserSessionGuard>
  );
}
