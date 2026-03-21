export function buildPasswordRecoveryRedirect(origin: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", "/auth/reset-password");
  return callbackUrl.toString();
}
