import { expect, test } from "@playwright/test";
import { setCsrfCookie } from "./helpers/csrf";
import { attachTenantDashboardMocks } from "./helpers/dashboard-mocks";

test.beforeEach(async ({ page }, testInfo) => {
  await setCsrfCookie(page, testInfo.project.use.baseURL);
});

function buildTenantSummary(id: string, name: string) {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    status: "active",
    ownerUserId: "usr_owner_01",
    planId: "plan:starter",
    activeModuleKeys: [],
    memberLimit: null,
  };
}

test("login browser successful flow routes to tenant selector", async ({ page }) => {
  await page.route("**/api/v1/auth/login/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "usr_owner_01",
            email: "owner@acme.dev",
            firstName: "Owner",
            lastName: "Acme",
            status: "active",
            isEmailVerified: true,
          },
          session: {
            id: "sess_01",
            userId: "usr_owner_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-e2e-login-ok",
      }),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: false,
            },
            {
              tenant: buildTenantSummary("507f191e810c19729de860eb", "Globex"),
              membership: {
                id: "mem_02",
                tenantId: "507f191e810c19729de860eb",
                userId: "usr_owner_01",
                roleKey: "tenant:member",
                status: "active",
              },
              isActive: false,
            },
          ],
        },
        traceId: "trace-e2e-tenant-list",
      }),
    });
  });

  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Acceso a la plataforma" })).toBeVisible();
  await page.getByLabel("Direccion de Email").fill("owner@acme.dev");
  await page.getByLabel("Contrasena").fill("Demo123!");
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  await expect(page).toHaveURL(/\/app\/tenants\/select$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Selecciona un tenant activo" }),
  ).toBeVisible();
});

test("login shows auth code when credentials are invalid", async ({ page }) => {
  await page.route("**/api/v1/auth/login/browser", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Invalid credentials",
        },
        traceId: "trace-e2e-auth-invalid",
      }),
    });
  });

  await page.goto("/login");

  await page.getByLabel("Direccion de Email").fill("wrong@acme.dev");
  await page.getByLabel("Contrasena").fill("WrongPass1!");
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  await expect(
    page.getByText("El email o la contrasena no coinciden. Verifica tus datos."),
  ).toBeVisible();
  await expect(page.getByText("Referencia de soporte:")).toHaveCount(0);
  await expect(page.getByText("CODE:")).toHaveCount(0);
  await expect(page.getByText("trace-e2e-auth-invalid")).toHaveCount(0);
});

test("login shows email verification guidance when account is pending", async ({ page }) => {
  await page.route("**/api/v1/auth/login/browser", async (route) => {
    await route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "AUTH_EMAIL_NOT_VERIFIED",
          message: "Email not verified",
        },
        traceId: "trace-e2e-auth-not-verified",
      }),
    });
  });

  await page.goto("/login");

  await page.getByLabel("Direccion de Email").fill("pending@acme.dev");
  await page.getByLabel("Contrasena").fill("Demo123!");
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  await expect(page.getByText("Debes verificar tu email antes de iniciar sesion.")).toBeVisible();
  await expect(page.getByText("Tu cuenta no tiene acceso a este entorno.")).toHaveCount(0);
});

test("register flow shows verification required state", async ({ page }) => {
  await page.route("**/api/v1/auth/register", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accepted: true,
        },
        traceId: "trace-e2e-register-ok",
      }),
    });
  });

  await page.goto("/register");

  await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Apellido").fill("Diaz");
  await page.getByLabel("Email corporativo").fill("ana@acme.dev");
  await page.getByLabel("Contrasena", { exact: true }).fill("Demo123!");
  await page.getByLabel("Confirmar contrasena").fill("Demo123!");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Revisa tu correo")).toBeVisible();
  await expect(
    page.getByText("Si la cuenta es elegible, enviamos instrucciones de verificacion a"),
  ).toBeVisible();
  await expect(
    page.getByText("Por seguridad, continua manualmente en la pantalla de verificacion de email."),
  ).toBeVisible();
});

test("verify email flow redirects to login", async ({ page }) => {
  let requestPayload: { email?: string; token?: string } | null = null;

  await page.route("**/api/v1/auth/verify-email", async (route) => {
    requestPayload = route.request().postDataJSON() as { email?: string; token?: string };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "usr_owner_01",
            email: "owner@acme.dev",
            firstName: "Owner",
            lastName: "Acme",
            status: "active",
            isEmailVerified: true,
          },
        },
        traceId: "trace-e2e-verify-ok",
      }),
    });
  });

  await page.goto("/auth/verify-email?email=owner@acme.dev&token=token_123456");

  await expect(page.getByRole("heading", { name: "Verifica tu email" })).toBeVisible();
  await expect(page.getByLabel("Token de verificacion")).toHaveValue("token_123456");
  await page.getByRole("button", { name: "Confirmar verificacion" }).click();

  await expect(page.getByText("Email verificado correctamente")).toBeVisible();
  await expect(page).toHaveURL(/\/login\?verified=1$/);
  expect(requestPayload).toEqual({
    email: "owner@acme.dev",
    token: "token_123456",
  });
  await expect(
    page.getByText("Email verificado correctamente. Ya puedes iniciar sesion."),
  ).toBeVisible();
});

test("verify email flow offers generic resend when token is invalid", async ({ page }) => {
  let resendPayload: { email?: string } | null = null;

  await page.route("**/api/v1/auth/verify-email", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "AUTH_EMAIL_VERIFICATION_INVALID",
          message: "Verification token invalid",
        },
        traceId: "trace-e2e-verify-invalid",
      }),
    });
  });

  await page.route("**/api/v1/auth/resend-verification", async (route) => {
    resendPayload = route.request().postDataJSON() as { email?: string };

    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accepted: true,
        },
        traceId: "trace-e2e-resend-ok",
      }),
    });
  });

  await page.goto("/auth/verify-email?email=owner@acme.dev&token=token_123456");

  await page.getByRole("button", { name: "Confirmar verificacion" }).click();

  await expect(
    page.getByText("El enlace de verificacion no es valido o ya expiro. Solicita uno nuevo."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reenviar verificacion" }).click();
  await expect(page.getByText("Solicitud aceptada.")).toBeVisible();
  await expect(
    page.getByText("Si la cuenta es elegible, enviamos nuevas instrucciones a"),
  ).toBeVisible();
  expect(resendPayload).toEqual({
    email: "owner@acme.dev",
  });
});

test("protected app route restores session through browser refresh", async ({ page }, testInfo) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "usr_owner_01",
            email: "owner@acme.dev",
            firstName: "Owner",
            lastName: "Acme",
            status: "active",
            isEmailVerified: true,
          },
          session: {
            id: "sess_restore_01",
            userId: "usr_owner_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-e2e-refresh-restore-ok",
      }),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-active",
      }),
    });
  });

  await setCsrfCookie(page, testInfo.project.use.baseURL);

  attachTenantDashboardMocks(page);
  await page.goto("/app");

  await expect(page.getByRole("heading", { name: "Dashboard tenant" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acme" })).toBeVisible();
});

test("protected app route redirects to login when browser refresh fails", async ({ page }, testInfo) => {
  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "AUTH_INVALID_REFRESH_TOKEN",
          message: "Refresh invalid",
        },
        traceId: "trace-e2e-refresh-expired",
      }),
    });
  });

  await setCsrfCookie(page, testInfo.project.use.baseURL);

  attachTenantDashboardMocks(page);
  await page.goto("/app");

  await expect(page).toHaveURL(/\/login\?expired=1$/);
  await expect(
    page.getByText("Tu sesion expiro o ya no es valida. Inicia sesion nuevamente."),
  ).toBeVisible();
});

test("login muestra bloqueo por lockout", async ({ page }) => {
  await page.route("**/api/v1/auth/login/browser", async (route) => {
    await route.fulfill({
      status: 423,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "AUTH_ACCOUNT_LOCKED",
          message: "Account locked",
        },
        traceId: "trace-e2e-auth-locked",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Direccion de Email").fill("lock@acme.dev");
  await page.getByLabel("Contrasena").fill("Demo123!");
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  await expect(
    page.getByText("La cuenta esta bloqueada temporalmente. Contacta soporte."),
  ).toBeVisible();
});

test("login muestra mensaje de rate limit", async ({ page }) => {
  await page.route("**/api/v1/auth/login/browser", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "GEN_RATE_LIMITED",
          message: "Too many attempts",
        },
        traceId: "trace-e2e-auth-ratelimit",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Direccion de Email").fill("rate@acme.dev");
  await page.getByLabel("Contrasena").fill("Demo123!");
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();

  await expect(
    page.getByText("Demasiados intentos. Espera un momento antes de reintentar."),
  ).toBeVisible();
});

test("logout route clears active session and blocks protected routes afterwards", async ({ page }, testInfo) => {
  await page.route("**/api/v1/auth/login/browser", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: "usr_owner_01",
            email: "owner@acme.dev",
            firstName: "Owner",
            lastName: "Acme",
            status: "active",
            isEmailVerified: true,
          },
          session: {
            id: "sess_01",
            userId: "usr_owner_01",
            expiresAt: "2026-12-31T23:59:59.000Z",
          },
        },
        traceId: "trace-e2e-login-logout-ok",
      }),
    });
  });

  await page.route("**/api/v1/tenant/mine", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          items: [
            {
              tenant: buildTenantSummary("507f191e810c19729de860ea", "Acme"),
              membership: {
                id: "mem_01",
                tenantId: "507f191e810c19729de860ea",
                userId: "usr_owner_01",
                roleKey: "tenant:owner",
                status: "active",
              },
              isActive: true,
            },
          ],
        },
        traceId: "trace-e2e-tenant-single",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Direccion de Email").fill("owner@acme.dev");
  await page.getByLabel("Contrasena").fill("Demo123!");
  await page.getByRole("button", { name: "Iniciar Sesion" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.route("**/api/v1/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          revokedSessionIds: ["sess_01"],
        },
        traceId: "trace-e2e-logout-ok",
      }),
    });
  });

  await page.route("**/api/v1/auth/refresh/browser", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "AUTH_INVALID_REFRESH_TOKEN",
          message: "Refresh invalid",
        },
        traceId: "trace-e2e-refresh-after-logout",
      }),
    });
  });

  await page.goto("/logout");

  await expect(page).toHaveURL(/\/login\?loggedOut=1$/);
  await expect(page.getByText("La sesion actual se cerro correctamente.")).toBeVisible();

  await setCsrfCookie(page, testInfo.project.use.baseURL);

  attachTenantDashboardMocks(page);
  await page.goto("/app");

  await expect(page).toHaveURL(/\/login\?expired=1$/);
});









