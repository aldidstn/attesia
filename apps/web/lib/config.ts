export function privyAppId() {
  return process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID;
}

export function normalizePrivyVerificationKey(value: string) {
  const key = value.trim();
  if (key.startsWith("-----BEGIN PUBLIC KEY-----")) return key;
  const lines = key.match(/.{1,64}/g)?.join("\n") ?? key;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}
