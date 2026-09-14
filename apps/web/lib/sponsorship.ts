export function isSponsorshipEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_SPONSORSHIP_MODE === "enabled" || env.NEXT_PUBLIC_SPONSORSHIP_ENABLED === "true";
}

export function canOfferSelfPay(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  if (/user (rejected|denied)|request rejected|cancelled/i.test(message)) return false;
  return /sponsor|paymaster|app pays|gas policy/i.test(message);
}
