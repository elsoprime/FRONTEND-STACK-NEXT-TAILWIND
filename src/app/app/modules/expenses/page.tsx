import { redirect } from "next/navigation";

export default function ExpensesModuleRedirect() {
  redirect("/app/expenses");
}
