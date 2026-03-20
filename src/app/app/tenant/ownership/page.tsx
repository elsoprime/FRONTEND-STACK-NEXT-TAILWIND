import { redirect } from "next/navigation";

export default function TenantOwnershipPage() {
  redirect("/app/members?tab=ownership");
}
