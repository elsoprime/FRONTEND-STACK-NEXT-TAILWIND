import { redirect } from "next/navigation";

export default function TenantInvitationsPage() {
  redirect("/app/members?tab=invitations");
}
