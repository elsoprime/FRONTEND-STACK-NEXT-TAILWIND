import { redirect } from "next/navigation";

export default function InventoryAlertsPage() {
  redirect("/app/inventory?tab=alerts");
}
