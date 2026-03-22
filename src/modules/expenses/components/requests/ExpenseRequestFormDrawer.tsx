"use client";

import { InventoryFormModal } from "@/components/ui/inventory-form-modal";
import {
  ExpenseRequestForm,
  type ExpenseRequestFormInitialData,
} from "@/modules/expenses/components/requests/ExpenseRequestForm";
import { type ExpenseRequest } from "@/lib/api/expenses.types";

type ExpenseRequestFormDrawerProps = {
  open: boolean;
  mode: "create" | "update";
  tenantId: string;
  initialData?: ExpenseRequestFormInitialData;
  onOpenChange: (open: boolean) => void;
  onCompleted: (request: ExpenseRequest) => void;
};

export function ExpenseRequestFormDrawer({
  open,
  mode,
  tenantId,
  initialData,
  onOpenChange,
  onCompleted,
}: ExpenseRequestFormDrawerProps) {
  const title = mode === "create" ? "Nueva solicitud de gasto" : "Editar solicitud de gasto";
  const description =
    mode === "create"
      ? "Registra un gasto nuevo y define si queda en borrador o enviado a revision."
      : "Actualiza la solicitud y decide si se mantiene en borrador o se envia a revision.";

  return (
    <InventoryFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="lg"
    >
      <ExpenseRequestForm
        tenantId={tenantId}
        mode={mode}
        initialData={initialData}
        onCancel={() => onOpenChange(false)}
        onCompleted={(request) => {
          onCompleted(request);
          onOpenChange(false);
        }}
      />
    </InventoryFormModal>
  );
}
