import type { Page } from "@playwright/test";

export async function setCsrfCookie(page: Page, baseURL?: string) {
  const origin = (baseURL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const primaryName = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
  const cookieNames = Array.from(new Set([primaryName, "csrf_token", "__csrf"]));

  await page.context().addCookies(
    cookieNames.map((name) => ({ name, value: "csrf-e2e", url: origin })),
  );

  await page.addInitScript((names) => {
    for (const name of names) {
      document.cookie = `${name}=csrf-e2e; path=/`;
    }
  }, cookieNames);
}
