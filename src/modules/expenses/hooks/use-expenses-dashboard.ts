"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/expenses.client";
import type {
  ExpenseDashboardAlert,
  ExpenseDashboardCategoryBreakdown,
  ExpenseDashboardDateWindow,
  ExpenseDashboardKpis,
  ExpenseDashboardTrendPoint,
  ExpenseRequestStatus,
} from "@/lib/api/expenses.types";
import { queryKeys } from "@/lib/query/query-keys";

export type ExpensesDashboardDateWindow = ExpenseDashboardDateWindow;

export type ExpensesDashboardFilters = {
  dateWindowDays: ExpensesDashboardDateWindow;
  status: "all" | ExpenseRequestStatus;
  categoryKey: "all" | string;
};

type UseExpensesDashboardResult = {
  filters: ExpensesDashboardFilters;
  setDateWindowDays: (value: ExpensesDashboardDateWindow) => void;
  setStatus: (value: "all" | ExpenseRequestStatus) => void;
  setCategoryKey: (value: "all" | string) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  primaryCurrency: string | null;
  hasMixedCurrencies: boolean;
  kpis: ExpenseDashboardKpis;
  trends: ExpenseDashboardTrendPoint[];
  categories: ExpenseDashboardCategoryBreakdown[];
  alerts: ExpenseDashboardAlert[];
  availableCategories: Array<{ key: string; name: string }>;
};

const DEFAULT_FILTERS: ExpensesDashboardFilters = {
  dateWindowDays: 30,
  status: "all",
  categoryKey: "all",
};

const EMPTY_KPIS: ExpenseDashboardKpis = {
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  totalAmount: 0,
  pendingAmount: 0,
};

export function useExpensesDashboard(tenantId: string): UseExpensesDashboardResult {
  const [filters, setFilters] = useState<ExpensesDashboardFilters>(DEFAULT_FILTERS);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.expensesDashboard(tenantId, {
      dateWindowDays: filters.dateWindowDays,
      status: filters.status,
      categoryKey: filters.categoryKey,
    }),
    queryFn: async () =>
      getDashboard(tenantId, {
        dateWindowDays: filters.dateWindowDays,
        status: filters.status === "all" ? undefined : filters.status,
        categoryKey: filters.categoryKey === "all" ? undefined : filters.categoryKey,
      }),
  });

  const dashboard = dashboardQuery.data;

  return {
    filters,
    setDateWindowDays: (value) =>
      setFilters((state) => ({
        ...state,
        dateWindowDays: value,
      })),
    setStatus: (value) =>
      setFilters((state) => ({
        ...state,
        status: value,
      })),
    setCategoryKey: (value) =>
      setFilters((state) => ({
        ...state,
        categoryKey: value,
      })),
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    errorMessage: dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null,
    primaryCurrency: dashboard?.primaryCurrency ?? null,
    hasMixedCurrencies: dashboard?.hasMixedCurrencies ?? false,
    kpis: dashboard?.kpis ?? EMPTY_KPIS,
    trends: dashboard?.trends ?? [],
    categories: dashboard?.categories ?? [],
    alerts: dashboard?.alerts ?? [],
    availableCategories: dashboard?.availableCategories ?? [],
  };
}
