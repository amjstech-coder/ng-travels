export type RealtimeEventType =
  | "TRIP_CREATED"
  | "TRIP_UPDATED"
  | "TRIP_ASSIGNED"
  | "TRIP_STATUS_CHANGED"
  | "DRIVER_STATUS_CHANGED"
  | "TRIP_STARTED"
  | "REACHED_PICKUP"
  | "CUSTOMER_PICKED"
  | "JOURNEY_STARTED"
  | "REACHED_DESTINATION"
  | "TRIP_COMPLETED"
  | "PAYMENT_ADDED"
  | "PAYMENT_UPDATED"
  | "EXPENSE_SUBMITTED"
  | "EXPENSE_APPROVED"
  | "EXPENSE_REJECTED"
  | "TRIP_CANCELLED"
  | "NOTIFICATION_CREATED"
  | "AUDIT_LOG_CREATED"
  | "LOCATION_UPDATED"
  | "DRIVER_ARRIVED"
  | "TRIP_ACCEPTED"
  | "VEHICLE_CREATED"
  | "VEHICLE_UPDATED";

export interface RealtimeMessage {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}

const supabaseUrl = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nihoyzdepvqkypvwpvvy.supabase.co"
).trim();

const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ""
).trim();

export const REALTIME_TOPIC = "ng_travels_realtime_changes";

// Only these small, non-sensitive fields are sent. The channel is readable by
// anyone holding the public anon key, so customer details, phone numbers and
// full trip records must never go out here — clients refetch via the
// authenticated API when they hear an event.
const SAFE_FIELDS = ["id", "tripId", "bookingId", "startingKm", "actualKm", "amount", "category", "status"] as const;

function sanitize(payload: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!payload || typeof payload !== "object") return out;
  for (const key of SAFE_FIELDS) {
    if (payload[key] !== undefined && payload[key] !== null) out[key] = payload[key];
  }
  return out;
}

/**
 * Publish an event to every connected app through Supabase Realtime
 * (Broadcast, REST endpoint). This is one short HTTP call — the server holds
 * no open connections, so it costs nothing while idle on serverless.
 */
export function broadcastRealtimeEvent(type: RealtimeEventType, payload: any): void {
  if (!supabaseKey) return;

  const message: RealtimeMessage = {
    type,
    payload: sanitize(payload),
    timestamp: new Date().toISOString(),
  };

  fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic: REALTIME_TOPIC, event: "message", payload: message, private: false }] }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => console.warn("[realtime] broadcast failed:", err?.message));
}
