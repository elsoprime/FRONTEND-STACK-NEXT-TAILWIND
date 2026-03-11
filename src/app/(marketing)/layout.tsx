import { CorporatePortalHeader } from "@/components/landing/corporate-portal-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CorporatePortalHeader />
      {children}
    </>
  );
}
