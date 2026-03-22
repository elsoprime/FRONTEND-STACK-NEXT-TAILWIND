"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCategories, listRequests } from "@/lib/api/expenses.client";
import type { ExpenseRequest, ExpenseRequestStatus } from "@/lib/api/expenses.types";
import { queryKeys } from "@/lib/query/query-keys";

export type ExpensesDashboardDateWindow = 7 | 30 | 90;

export type ExpensesDashboardFilters = {
  dateWindowDays: ExpensesDashboardDateWindow;
  status: "all" | ExpenseRequestStatus;
  categoryKey: "all" | string;
};

type ExpenseTrendPoint = {
  day: string;
  requested: number;
  approved: number;
  rejected: number;
};

type ExpenseCategoryBreakdown = {
  categoryKey: string;
  label: string;
  totalAmount: number;
  requests: number;
};

type ExpenseDashboardAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
};

type ExpenseDashboardKpis = {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  pendingAmount: number;
};

type UseExpensesDashboardResult = {
  filters: ExpensesDashboardFilters;
  setDateWindowDays: (value: ExpensesDashboardDateWindow) => void;
  setStatus: (value: "all" | ExpenseRequestStatus) => void;
  setCategoryKey: (value: "all" | string) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  kpis: ExpenseDashboardKpis;
  trends: ExpenseTrendPoint[];
  categories: ExpenseCategoryBreakdown[];
  alerts: ExpenseDashboardAlert[];
  availableCategories: Array<{ key: string; name: string }>;
};

const DEFAULT_FILTERS: ExpensesDashboardFilters = {
  dateWindowDays: 30,
  status: "all",
  categoryKey: "all",
};

const REQUEST_LIST_LIMIT = 100;

export function useExpensesDashboard(tenantId: string): UseExpensesDashboardResult {
  const [filters, setFilters] = useState<ExpensesDashboardFilters>(DEFAULT_FILTERS);

  const requestsQuery = useQuery({
    queryKey: queryKeys.expensesDashboardRequests(tenantId),
    queryFn: async () =>
      listRequests(tenantId, {
        page: 1,
        limit: REQUEST_LIST_LIMIT,
      }),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.expensesDashboardCategories(tenantId),
    queryFn: async () =>
      listCategories(tenantId, {
        page: 1,
        limit: 100,
        includeInactive: true,
      }),
  });

  const availableCategories = useMemo(
    () =>
      (categoriesQuery.data?.items ?? []).map((category) => ({
        key: category.key,
        name: category.name,
      })),
    [categoriesQuery.data?.items],
  );

  const filteredRequests = useMemo(() => {
    const requests = requestsQuery.data?.items ?? [];
    const startDate = resolveStartDate(filters.dateWindowDays);

    return requests.filter((request) => {
      const eventDate = new Date(request.expenseDate);
      if (Number.isNaN(eventDate.getTime()) || eventDate < startDate) {
        return false;
      }

      if (filters.status !== "all" && request.status !== filters.status) {
        return false;
      }

      if (filters.categoryKey !== "all" && request.categoryKey !== filters.categoryKey) {
        return false;
      }

      return true;
    });
  }, [filters.categoryKey, filters.dateWindowDays, filters.status, requestsQuery.data?.items]);

  const kpis = useMemo<ExpenseDashboardKpis>(() => {
    const pendingRequests = filteredRequests.filter(
      (request) => request.status === "submitted" || request.status === "returned",
    );
    const approvedRequests = filteredRequests.filter((request) => request.status === "approved");
    const rejectedRequests = filteredRequests.filter((request) => request.status === "rejected");

    return {
      totalRequests: filteredRequests.length,
      pendingRequests: pendingRequests.length,
      approvedRequests: approvedRequests.length,
      rejectedRequests: rejectedRequests.length,
      totalAmount: sumAmounts(filteredRequests),
      pendingAmount: sumAmounts(pendingRequests),
    };
  }, [filteredRequests]);

  const trends = useMemo<ExpenseTrendPoint[]>(
    () => buildTrends(filteredRequests, filters.dateWindowDays),
    [filteredRequests, filters.dateWindowDays],
  );

  const categories = useMemo<ExpenseCategoryBreakdown[]>(
    () => buildCategoryBreakdown(filteredRequests, availableCategories),
    [availableCategories, filteredRequests],
  );

  const alerts = useMemo<ExpenseDashboardAlert[]>(
    () => buildOperationalAlerts(filteredRequests),
    [filteredRequests],
  );

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
    isLoading: requestsQuery.isLoading || categoriesQuery.isLoading,
    isError: requestsQuery.isError || categoriesQuery.isError,
    errorMessage:
      requestsQuery.error instanceof Error
        ? requestsQuery.error.message
        : categoriesQuery.error instanceof Error
          ? categoriesQuery.error.message
          : null,
    kpis,
    trends,
    categories,
    alerts,
    availableCategories,
  };
}

function resolveStartDate(windowDays: ExpensesDashboardDateWindow): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (windowDays - 1));
  return start;
}

function sumAmounts(requests: ExpenseRequest[]): number {
  return requests.reduce((accumulator, current) => accumulator + current.amount, 0);
}

function buildTrends(
  requests: ExpenseRequest[],
  windowDays: ExpensesDashboardDateWindow,
): ExpenseTrendPoint[] {
  const startDate = resolveStartDate(windowDays);
  const days = Array.from({ length: windowDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });

  return days.map((date) => {
    const dayKey = toDayKey(date);
    const dayRequests = requests.filter((request) => toDayKey(new Date(request.expenseDate)) === dayKey);

    return {
      day: formatShortDay(date),
      requested: dayRequests.length,
      approved: dayRequests.filter((request) => request.status === "approved").length,
      rejected: dayRequests.filter((request) => request.status === "rejected").length,
    };
  });
}

function buildCategoryBreakdown(
  requests: ExpenseRequest[],
  catalog: Array<{ key: string; name: string }>,
): ExpenseCategoryBreakdown[] {
  const categoryMap = new Map<string, ExpenseCategoryBreakdown>();

  for (const request of requests) {
    const existing = categoryMap.get(request.categoryKey);
    if (existing) {
      existing.requests += 1;
      existing.totalAmount += request.amount;
      continue;
    }

    const category = catalog.find((item) => item.key === request.categoryKey);
    categoryMap.set(request.categoryKey, {
      categoryKey: request.categoryKey,
      label: category?.name ?? request.categoryKey,
      requests: 1,
      totalAmount: request.amount,
    });
  }

  return Array.from(categoryMap.values())
    .sort((left, right) => right.totalAmount - left.totalAmount)
    .slice(0, 6);
}

function buildOperationalAlerts(requests: ExpenseRequest[]): ExpenseDashboardAlert[] {
  const pending = requests.filter(
    (request) => request.status === "submitted" || request.status === "returned",
  );
  const alerts: ExpenseDashboardAlert[] = [];

  if (pending.length >= 15) {
    alerts.push({
      id: "pending-high",
      severity: "warning",
      title: "Cola pendiente alta",
      description: `Hay ${pending.length} solicitudes pendientes para revision o decision.`,
    });
  }

  const oldestPending = pending
    .map((request) => new Date(request.createdAt))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime())[0];

  if (oldestPending) {
    const ageInDays = Math.floor((Date.now() - oldestPending.getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays >= 4) {
      alerts.push({
        id: "sla-aging",
        severity: "critical",
        title: "Riesgo de SLA",
        description: `La solicitud pendiente mas antigua supera ${ageInDays} dias.`,
      });
    }
  }

  const rejected = requests.filter((request) => request.status === "rejected").length;
  const rejectionRate = requests.length > 0 ? rejected / requests.length : 0;
  if (rejectionRate >= 0.35) {
    alerts.push({
      id: "rejection-rate",
      severity: "info",
      title: "Tasa de rechazo elevada",
      description: "Revisa politicas de categoria o calidad de captura en solicitudes.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "healthy",
      severity: "info",
      title: "Operacion estable",
      description: "No se detectaron alertas operativas para el rango seleccionado.",
    });
  }

  return alerts;
}

function toDayKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function formatShortDay(value: Date): string {
  return value.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
  });
}
