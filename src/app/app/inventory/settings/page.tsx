import { redirect } from "next/navigation";

export default function InventorySettingsPage() {
  redirect("/app/inventory?tab=settings");
}
