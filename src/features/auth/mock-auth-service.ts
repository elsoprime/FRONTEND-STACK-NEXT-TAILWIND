export type LoginInput = {
  email: string;
  password: string;
};

export type LoginSuccessEnvelope = {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string | null;
      status: "active";
      isEmailVerified: true;
    };
    session: {
      id: string;
      userId: string;
      expiresAt: string;
    };
  };
  traceId: string;
};

export type LoginErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  traceId: string;
};

export type LoginResult = LoginSuccessEnvelope | LoginErrorEnvelope;

const DEMO_EMAIL = "owner@acme.dev";
const DEMO_PASSWORD = "Demo123!";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function mockLoginBrowser(input: LoginInput): Promise<LoginResult> {
  await wait(650);

  if (input.email === "locked@acme.dev") {
    return {
      success: false,
      error: {
        code: "AUTH_ACCOUNT_LOCKED",
        message: "Account locked",
      },
      traceId: "mock-auth-locked",
    };
  }

  if (input.email === "pending@acme.dev") {
    return {
      success: false,
      error: {
        code: "AUTH_EMAIL_NOT_VERIFIED",
        message: "Email not verified",
      },
      traceId: "mock-auth-email-not-verified",
    };
  }

  if (input.email === DEMO_EMAIL && input.password === DEMO_PASSWORD) {
    return {
      success: true,
      data: {
        user: {
          id: "usr_mock_owner_001",
          email: DEMO_EMAIL,
          firstName: "Owner",
          lastName: "Acme",
          status: "active",
          isEmailVerified: true,
        },
        session: {
          id: "sess_mock_20260308_001",
          userId: "usr_mock_owner_001",
          expiresAt: "2026-12-31T23:59:59.000Z",
        },
      },
      traceId: "mock-auth-login-success",
    };
  }

  return {
    success: false,
    error: {
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Invalid credentials",
    },
    traceId: "mock-auth-invalid-credentials",
  };
}
