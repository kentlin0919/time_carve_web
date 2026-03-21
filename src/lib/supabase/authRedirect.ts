export function buildPasswordRecoveryRedirect(origin: string) {
  return new URL("/auth/reset-password", origin).toString();
}
