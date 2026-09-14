export function privyAppId() {
  return process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID;
}
