export const analyticsEvents = ["activation", "vccr", "reviewer_conversion", "indexing_reliability", "retention"] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];
const allowedProperties: Record<AnalyticsEvent, readonly string[]> = {
  activation: ["contributionType"], vccr: ["eligible", "verified"], reviewer_conversion: ["claimType"],
  indexing_reliability: ["latencyMs", "outcome"], retention: ["periodDays", "returned"],
};

export function sanitizeAnalyticsProperties(event: AnalyticsEvent, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Analytics properties must be an object");
  const allowed = [...allowedProperties[event], "anonymousId"];
  return Object.fromEntries(Object.entries(input).map(([key, value]) => {
    if (!allowed.includes(key)) throw new Error(`Unexpected analytics property: ${key}`);
    if (!["string", "number", "boolean"].includes(typeof value) || typeof value === "number" && !Number.isFinite(value)) throw new Error(`Invalid analytics property: ${key}`);
    if (typeof value === "string" && (/^0x[0-9a-f]{40}$/i.test(value) || value.length > 80 || /[\r\n]|https?:\/\//i.test(value))) throw new Error("Wallet addresses are not accepted in analytics");
    return [key, value];
  }));
}

export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  try {
    let anonymousId = localStorage.getItem("attestia:analytics-id"); if (!anonymousId) { anonymousId = crypto.randomUUID(); localStorage.setItem("attestia:analytics-id", anonymousId); }
    const safe = sanitizeAnalyticsProperties(event, { ...properties, anonymousId });
    navigator.sendBeacon?.("/api/analytics", new Blob([JSON.stringify({ event, properties: safe })], { type: "application/json" }));
  } catch { /* Analytics must never interrupt a completed user action. */ }
}
