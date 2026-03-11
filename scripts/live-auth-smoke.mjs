import assert from "node:assert/strict";
import { chromium } from "playwright";

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
const MAILPIT_BASE_URL = process.env.MAILPIT_BASE_URL ?? "http://localhost:8025";

async function waitForMessage(email, timeoutMs = 20_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const response = await fetch(`${MAILPIT_BASE_URL}/api/v1/messages`);
    const data = await response.json();
    const message = (data.messages || []).find(
      (entry) =>
        Array.isArray(entry.To) && entry.To.some((recipient) => recipient.Address === email),
    );

    if (message) {
      const detailResponse = await fetch(`${MAILPIT_BASE_URL}/api/v1/message/${message.ID}`);
      return detailResponse.json();
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Mailpit message not found for ${email}`);
}

function extractVerificationUrl(message) {
  const text = typeof message.Text === "string" ? message.Text : "";
  const frontendBaseUrlRegex = FRONTEND_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${frontendBaseUrlRegex}/auth/verify-email\\?email=[^\\s]+`));

  assert.ok(match, "Verification URL not found in Mailpit message");
  return match[0];
}

async function run() {
  const mode = process.env.QA_AUTH_MODE ?? "full";
  const email = `qa.live.${Date.now()}@example.test`;
  const password = "Demo123!";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(20_000);

  const summary = {
    email,
    registerUi: null,
    pendingLoginUi: null,
    pendingLoginUrl: null,
    pendingLoginAlerts: [],
    pendingLoginApi: null,
    loginApiResponses: [],
    pendingLoginRequests: [],
    pendingLoginButton: null,
    pendingLoginBodySnippet: null,
    tenantMineResponses: [],
    pageErrors: [],
    verifyFirstAttempt: null,
    verifySecondAttempt: null,
    verifyApiResponses: [],
    verifySecondAttemptUrl: null,
    verifySecondAttemptAlerts: [],
    postVerifyLoginRoute: null,
  };
  globalThis.__qaSummary = summary;

  page.on("pageerror", (error) => {
    summary.pageErrors.push(error.message);
  });

  page.on("response", async (response) => {
    if (response.url().includes("/api/v1/auth/login/browser")) {
      let resolved;

      try {
        resolved = {
          status: response.status(),
          body: await response.text(),
        };
      } catch {
        resolved = {
          status: response.status(),
          body: "<unavailable>",
        };
      }

      summary.loginApiResponses.push(resolved);
      summary.pendingLoginApi = resolved;
      return;
    }

    if (response.url().includes("/api/v1/tenant/mine")) {
      try {
        summary.tenantMineResponses.push({
          status: response.status(),
          body: await response.text(),
        });
      } catch {
        summary.tenantMineResponses.push({
          status: response.status(),
          body: "<unavailable>",
        });
      }
      return;
    }

    if (response.url().includes("/api/v1/auth/verify-email")) {
      try {
        summary.verifyApiResponses.push({
          status: response.status(),
          body: await response.text(),
        });
      } catch {
        summary.verifyApiResponses.push({
          status: response.status(),
          body: "<unavailable>",
        });
      }
    }
  });

  page.on("request", (request) => {
    if (!request.url().includes("/api/v1/auth/login/browser")) {
      return;
    }

    summary.pendingLoginRequests.push({
      method: request.method(),
      url: request.url(),
      postData: request.postData() ?? null,
    });
  });

  try {
    await page.goto(`${FRONTEND_BASE_URL}/register`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3_000);
    await page.getByLabel("Nombre").fill("QA");
    await page.getByLabel("Apellido").fill("Live");
    await page.getByLabel("Email corporativo").fill(email);
    await page.getByLabel("Contrasena", { exact: true }).fill(password);
    await page.getByLabel("Confirmar contrasena").fill(password);
    await page.locator("form").evaluate((form) => form.requestSubmit());
    await page.getByText("Revisa tu correo").waitFor();
    summary.registerUi = await page.getByText("Revisa tu correo").textContent();

    if (mode === "full") {
      await page.goto(`${FRONTEND_BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3_000);
      await page.getByLabel("Direccion de Email").fill(email);
      await page.getByLabel("Contrasena").fill(password);
      summary.pendingLoginButton = await page
        .getByRole("button", { name: "Iniciar Sesion" })
        .evaluate((button) => ({
          text: button.textContent,
          disabled: button.disabled,
        }));
      await page.locator("form").evaluate((form) => form.requestSubmit());
      await page.waitForTimeout(1_500);
      summary.pendingLoginUrl = page.url();
      summary.pendingLoginAlerts = await page.locator('[role="alert"]').allTextContents();
      summary.pendingLoginBodySnippet =
        (await page.locator("body").textContent())?.replace(/\s+/g, " ").slice(0, 600) ?? null;
      await page.getByText("Debes verificar tu email antes de iniciar sesion.").waitFor();
      summary.pendingLoginUi = await page
        .getByText("Debes verificar tu email antes de iniciar sesion.")
        .textContent();
    }

    const message = await waitForMessage(email);
    const verifyUrl = extractVerificationUrl(message);

    await page.goto(verifyUrl, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3_000);
    await page.getByRole("button", { name: "Confirmar verificacion" }).click();
    await page.waitForURL(/\/login\?verified=1$/);
    await page.getByText("Email verificado correctamente. Ya puedes iniciar sesion.").waitFor();
    summary.verifyFirstAttempt = "verified";

    if (mode === "full") {
      await page.goto(`${FRONTEND_BASE_URL}/login`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(3_000);
      await page.getByLabel("Direccion de Email").fill(email);
      await page.getByLabel("Contrasena").fill(password);
      await page.locator("form").evaluate((form) => form.requestSubmit());
      await page.waitForTimeout(5_000);
      summary.postVerifyLoginRoute = page.url();
      if (!/\/app\/tenants\/create$/.test(summary.postVerifyLoginRoute)) {
        throw new Error(`Unexpected post-verify login route: ${summary.postVerifyLoginRoute}`);
      }
    }

    await page.goto(verifyUrl, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3_000);
    await page.getByRole("button", { name: "Confirmar verificacion" }).click();
    await page.waitForTimeout(1_500);
    summary.verifySecondAttemptUrl = page.url();
    summary.verifySecondAttemptAlerts = await page.locator('[role="alert"]').allTextContents();
    await page
      .getByText("El enlace de verificacion no es valido o ya expiro. Solicita uno nuevo.")
      .waitFor();
    summary.verifySecondAttempt = await page
      .getByText("El enlace de verificacion no es valido o ya expiro. Solicita uno nuevo.")
      .textContent();

    console.log(JSON.stringify({ success: true, summary }, null, 2));
  } finally {
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        summary:
          typeof globalThis.__qaSummary === "object" && globalThis.__qaSummary
            ? globalThis.__qaSummary
            : null,
        error:
          error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
