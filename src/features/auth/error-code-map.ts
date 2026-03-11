const AUTH_ERROR_COPY: Record<string, string> = {
  AUTH_UNAUTHENTICATED: "Tu sesion no es valida o expiro. Inicia sesion nuevamente.",
  AUTH_INVALID_CREDENTIALS: "El email o la contrasena no coinciden. Verifica tus datos.",
  AUTH_CSRF_INVALID: "La sesion de seguridad no es valida. Recarga la pagina e intenta otra vez.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "Ese email ya esta registrado. Usa otro email o revisa si ya existe una cuenta asociada.",
  AUTH_EMAIL_NOT_VERIFIED: "Debes verificar tu email antes de iniciar sesion.",
  AUTH_EMAIL_VERIFICATION_INVALID: "El enlace de verificacion ya no es valido. Solicita uno nuevo.",
  AUTH_PASSWORD_RESET_INVALID:
    "El token de recuperacion no es valido o expiro. Solicita uno nuevo.",
  AUTH_PASSWORD_CHANGE_CURRENT_INVALID: "La contrasena actual no coincide.",
  AUTH_PASSWORD_CHANGE_REUSED: "La nueva contrasena no puede ser igual a la actual.",
  AUTH_INVALID_REFRESH_TOKEN: "No se pudo renovar la sesion. Inicia sesion nuevamente.",
  AUTH_ACCOUNT_LOCKED: "La cuenta esta bloqueada temporalmente. Contacta soporte.",
  AUTH_TWO_FACTOR_REQUIRED: "Debes ingresar un codigo 2FA para continuar.",
  AUTH_TWO_FACTOR_INVALID: "El codigo 2FA no es valido. Intenta nuevamente.",
  AUTH_TWO_FACTOR_ALREADY_ENABLED: "2FA ya se encuentra habilitado.",
  AUTH_TWO_FACTOR_NOT_ENABLED: "2FA no esta habilitado para esta cuenta.",
  GEN_RATE_LIMITED: "Demasiados intentos. Espera un momento antes de reintentar.",
  GEN_VALIDATION_ERROR: "Revisa los datos ingresados e intenta nuevamente.",
  RBAC_PERMISSION_DENIED: "No tienes permiso para ingresar a esta vista.",
  RBAC_ROLE_DENIED: "Tu rol actual no permite esta accion.",
};

export function resolveAuthErrorMessage(code: string): string {
  return AUTH_ERROR_COPY[code] ?? "No se pudo completar la solicitud. Intenta nuevamente.";
}
