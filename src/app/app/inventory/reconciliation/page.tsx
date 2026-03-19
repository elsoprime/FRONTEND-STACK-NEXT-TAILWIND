import { redirect } from "next/navigation";

export default function InventoryReconciliationPage() {
  redirect("/app/inventory?tab=reconciliation");
}
