import { describe, expect, it } from "vitest";
import { resolveAuthErrorMessage } from "@/features/auth/error-code-map";
import { mockLoginBrowser } from "@/features/auth/mock-auth-service";

describe("mockLoginBrowser", () => {
  it("returns success envelope for demo credentials", async () => {
    const result = await mockLoginBrowser({
      email: "owner@acme.dev",
      password: "Demo123!",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.user.email).toBe("owner@acme.dev");
      expect(result.traceId).toBe("mock-auth-login-success");
    }
  });

  it("returns auth code for invalid credentials", async () => {
    const result = await mockLoginBrowser({
      email: "foo@bar.dev",
      password: "wrongpass",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.code).toBe("AUTH_INVALID_CREDENTIALS");
      expect(resolveAuthErrorMessage(result.error.code)).toContain(
        "El email o la contrasena no coinciden",
      );
    }
  });
});
