"use client";

import { ThemeProvider } from "next-themes";

type MarketingThemeProviderProps = {
  children: React.ReactNode;
};

export function MarketingThemeProvider({ children }: MarketingThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
