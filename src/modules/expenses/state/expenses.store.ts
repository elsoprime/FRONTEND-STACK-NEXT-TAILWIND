import { create } from "zustand";
import type { ExpenseRequestStatus } from "@/lib/api/expenses.types";

type ExpenseWorkflowDraft = {
  reviewComment: string;
  rejectionReasonCode: string;
  rejectionComment: string;
  cancelReason: string;
  paymentReference: string;
};

type ExpensesQueueFilters = {
  status: ExpenseRequestStatus | "all";
  search: string;
};

type ExpensesStore = {
  queuePage: number;
  queueLimit: number;
  selectedRequestId: string | null;
  requestFormOpen: boolean;
  requestFormMode: "create" | "update";
  queueFilters: ExpensesQueueFilters;
  workflowDraft: ExpenseWorkflowDraft;
  setQueuePage: (page: number) => void;
  setQueueLimit: (limit: number) => void;
  setQueueStatusFilter: (status: ExpenseRequestStatus | "all") => void;
  setQueueSearchFilter: (search: string) => void;
  resetQueueFilters: () => void;
  setRequestFormState: (input: { open: boolean; mode?: "create" | "update" }) => void;
  closeRequestForm: () => void;
  setSelectedRequestId: (requestId: string | null) => void;
  updateWorkflowDraft: (patch: Partial<ExpenseWorkflowDraft>) => void;
  resetWorkflowDraft: () => void;
};

const initialWorkflowDraft: ExpenseWorkflowDraft = {
  reviewComment: "",
  rejectionReasonCode: "",
  rejectionComment: "",
  cancelReason: "",
  paymentReference: "",
};

const initialQueueFilters: ExpensesQueueFilters = {
  status: "all",
  search: "",
};

const initialState = {
  queuePage: 1,
  queueLimit: 8,
  selectedRequestId: null,
  requestFormOpen: false,
  requestFormMode: "create" as const,
  queueFilters: initialQueueFilters,
  workflowDraft: initialWorkflowDraft,
};

export const useExpensesStore = create<ExpensesStore>((set) => ({
  ...initialState,
  setQueuePage: (queuePage) =>
    set((state) => ({
      queuePage: Math.max(1, queuePage),
      queueLimit: state.queueLimit,
    })),
  setQueueLimit: (queueLimit) =>
    set({
      queueLimit: Math.max(1, queueLimit),
      queuePage: 1,
    }),
  setQueueStatusFilter: (status) =>
    set((state) => ({
      queueFilters: {
        ...state.queueFilters,
        status,
      },
      queuePage: 1,
    })),
  setQueueSearchFilter: (search) =>
    set((state) => ({
      queueFilters: {
        ...state.queueFilters,
        search,
      },
      queuePage: 1,
    })),
  resetQueueFilters: () =>
    set({
      queueFilters: initialQueueFilters,
      queuePage: 1,
    }),
  setRequestFormState: ({ open, mode }) =>
    set((state) => ({
      requestFormOpen: open,
      requestFormMode: mode ?? state.requestFormMode,
    })),
  closeRequestForm: () =>
    set({
      requestFormOpen: false,
      requestFormMode: "create",
    }),
  setSelectedRequestId: (selectedRequestId) => set({ selectedRequestId }),
  updateWorkflowDraft: (patch) =>
    set((state) => ({
      workflowDraft: {
        ...state.workflowDraft,
        ...patch,
      },
    })),
  resetWorkflowDraft: () => set({ workflowDraft: initialWorkflowDraft }),
}));
