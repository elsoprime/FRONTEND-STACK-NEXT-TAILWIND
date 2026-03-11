import { create } from "zustand";
import { type TenantRuntime } from "@/features/tenant/tenant-settings.schemas";
import { type MembershipView, type TenantView } from "@/features/tenant/tenant.schemas";

type TenantStore = {
  tenantId: string | null;
  activeTenant: TenantView | null;
  activeMembership: MembershipView | null;
  effectiveRuntime: TenantRuntime | null;
  setActiveTenantContext: (input: {
    tenant: TenantView;
    membership: MembershipView;
    effectiveRuntime?: TenantRuntime | null;
  }) => void;
  setEffectiveRuntime: (effectiveRuntime: TenantRuntime | null) => void;
  setTenantId: (tenantId: string | null) => void;
  clearTenantId: () => void;
  clearTenantContext: () => void;
};

const initialTenantState = {
  tenantId: null,
  activeTenant: null,
  activeMembership: null,
  effectiveRuntime: null,
};

export const useTenantStore = create<TenantStore>((set) => ({
  ...initialTenantState,
  setActiveTenantContext: ({ tenant, membership, effectiveRuntime = null }) =>
    set({
      tenantId: tenant.id,
      activeTenant: tenant,
      activeMembership: membership,
      effectiveRuntime,
    }),
  setEffectiveRuntime: (effectiveRuntime) => set({ effectiveRuntime }),
  setTenantId: (tenantId) =>
    set((state) => ({
      tenantId,
      activeTenant: state.activeTenant?.id === tenantId ? state.activeTenant : null,
      activeMembership: state.activeTenant?.id === tenantId ? state.activeMembership : null,
      effectiveRuntime: state.activeTenant?.id === tenantId ? state.effectiveRuntime : null,
    })),
  clearTenantId: () => set(initialTenantState),
  clearTenantContext: () => set(initialTenantState),
}));
