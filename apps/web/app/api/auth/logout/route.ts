import { apiError, json } from "@/lib/api";
import { endSession } from "@/lib/auth";
export async function POST(request: Request) { try { await endSession(); return json({ ok: true }); } catch (error) { return apiError("CONFIG_REQUIRED", error instanceof Error ? error.message : "Logout unavailable", request); } }
