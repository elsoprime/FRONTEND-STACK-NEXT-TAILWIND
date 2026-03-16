export type PlanDisplayName = "Starter" | "Professional" | "Enterprise";

type PlanCatalogEntry = {
  key: string;
  displayName: PlanDisplayName;
  description: string;
  rank: number;
  allowedModuleKeys: readonly string[];
};

const PLAN_CATALOG: readonly PlanCatalogEntry[] = [
  {
    key: "plan:starter",
    displayName: "Starter",
    description: "Plan base para operaciones iniciales.",
    rank: 1,
    allowedModuleKeys: ["inventory"],
  },
  {
    key: "plan:growth",
    displayName: "Professional",
    description: "Plan profesional para equipos en crecimiento.",
    rank: 2,
    allowedModuleKeys: ["inventory", "crm", "hr"],
  },
  {
    key: "plan:professional",
    displayName: "Professional",
    description: "Alias del plan Professional para compatibilidad.",
    rank: 2,
    allowedModuleKeys: ["inventory", "crm", "hr"],
  },
  {
    key: "plan:enterprise",
    displayName: "Enterprise",
    description: "Plan avanzado con modulos extendidos y auditoria.",
    rank: 3,
    allowedModuleKeys: ["inventory", "crm", "hr", "audit"],
  },
];

const PLAN_BY_KEY = new Map(PLAN_CATALOG.map((entry) => [entry.key, entry]));

export const CANONICAL_PLAN_KEYS = ["plan:starter", "plan:growth", "plan:enterprise"] as const;

export function resolvePlanDisplayName(
  planKey: string | null | undefined,
  fallbackName?: string,
): string {
  if (planKey && PLAN_BY_KEY.has(planKey)) {
    return PLAN_BY_KEY.get(planKey)?.displayName ?? "Plan";
  }

  if (fallbackName && fallbackName.trim().length > 0) {
    return fallbackName;
  }

  return planKey ?? "Plan";
}

export function resolvePlanAllowedModuleKeys(
  planKey: string | null | undefined,
): readonly string[] {
  if (!planKey) {
    return [];
  }

  return PLAN_BY_KEY.get(planKey)?.allowedModuleKeys ?? [];
}

export function resolvePlanDescription(planKey: string): string {
  return PLAN_BY_KEY.get(planKey)?.description ?? "Plan disponible";
}

export function resolvePlanRank(planKey: string): number {
  return PLAN_BY_KEY.get(planKey)?.rank ?? 999;
}
