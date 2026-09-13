import { analyticsEvents, sanitizeAnalyticsProperties, type AnalyticsEvent } from "@/lib/analytics";
import { apiError, json } from "@/lib/api";
export async function POST(request: Request) {
  try { const body = await request.json(); if (!analyticsEvents.includes(body.event)) return apiError("BAD_REQUEST", "Unknown analytics event", request); const safe = sanitizeAnalyticsProperties(body.event as AnalyticsEvent, body.properties ?? {}); if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return json({ accepted: true, delivered: false }); const { anonymousId, ...properties } = safe; const response = await fetch("https://us.i.posthog.com/capture/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY, event: body.event, properties: { ...properties, distinct_id: typeof anonymousId === "string" ? anonymousId : crypto.randomUUID() } }) }); return json({ accepted: true, delivered: response.ok }); }
  catch { return apiError("BAD_REQUEST", "Invalid analytics event", request); }
}
