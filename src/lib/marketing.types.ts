import type { LucideIcon } from "lucide-react";

export type MarketingMainRoute =
  | "/"
  | "/security"
  | "/methodology"
  | "/integrations"
  | "/solutions/logistics"
  | "/pricing"
  | "/developers";

export type MarketingContactSlug =
  | "demo"
  | "plan"
  | "strategy"
  | "connectors"
  | "custom-connector"
  | "technical-consulting";

export type MarketingContactRoute = `/contact/${MarketingContactSlug}`;

export type MarketingRoute = MarketingMainRoute | MarketingContactRoute;

export type MarketingNavItem<TRoute extends MarketingMainRoute = MarketingMainRoute> = Readonly<{
  label: string;
  href: TRoute;
}>;

export type MarketingCta<TRoute extends MarketingRoute = MarketingRoute> = Readonly<{
  label: string;
  href: TRoute;
}>;

export type MarketingStat = Readonly<{
  value: string;
  label: string;
}>;

export type MarketingFaq = Readonly<{
  question: string;
  answer: string;
}>;

export type MarketingIconFeature<TIcon extends LucideIcon = LucideIcon> = Readonly<{
  title: string;
  description: string;
  icon: TIcon;
}>;

export type MarketingPricingPlan = Readonly<{
  name: string;
  price: number | "Custom";
  description: string;
  features: readonly string[];
  cta: string;
  popular?: boolean;
}>;

export type MethodologyPhaseCode = `0${1 | 2 | 3 | 4 | 5}`;

export type MarketingMethodologyPhase<TIcon extends LucideIcon = LucideIcon> = Readonly<{
  phase: MethodologyPhaseCode;
  title: string;
  subtitle: string;
  businessValue: string;
  technicalMilestones: readonly string[];
  icon: TIcon;
  toneClassName: string;
}>;

export type MarketingIntegration = Readonly<{
  name: string;
  description: string;
  acronym: string;
}>;

export type MarketingIntegrationCategory<TIcon extends LucideIcon = LucideIcon> = Readonly<{
  name: string;
  icon: TIcon;
  integrations: readonly MarketingIntegration[];
}>;
