export const analyticsEvents = ["activation", "vccr", "reviewer_conversion", "indexing_reliability", "retention"] as const;
export type AnalyticsEvent = (typeof analyticsEvents)[number];
export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  const safe = Object.fromEntries(Object.entries(properties).filter(([key]) => !/(wallet|address|evidence|source|metadata|content)/i.test(key)));
  let anonymousId = localStorage.getItem("attestia:analytics-id"); if (!anonymousId) { anonymousId = crypto.randomUUID(); localStorage.setItem("attestia:analytics-id", anonymousId); }
  navigator.sendBeacon?.("/api/analytics", new Blob([JSON.stringify({ event, properties: { ...safe, anonymousId } })], { type: "application/json" }));
}
