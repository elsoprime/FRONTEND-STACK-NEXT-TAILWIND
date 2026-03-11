export interface PortalSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon?: string;
  badge?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number | "Custom";
  interval: "monthly" | "yearly";
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

export interface DeveloperResource {
  title: string;
  description: string;
  link: string;
  type: "api" | "guide" | "sdk";
}
