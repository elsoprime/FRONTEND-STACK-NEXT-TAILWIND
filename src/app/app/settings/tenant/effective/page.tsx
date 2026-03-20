import { redirect } from "next/navigation";

export default function TenantSettingsEffectivePage() {
  redirect("/app/settings/tenant?tab=effective");
}
