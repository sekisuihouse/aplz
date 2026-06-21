import type { AnalyticsEventName } from "@/lib/analytics";

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  metadata: Record<string, string | number | boolean | null> = {}
) {
  if (typeof window === "undefined") return;
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_name: eventName,
      path: window.location.pathname,
      referrer: document.referrer,
      metadata,
    }),
    keepalive: true,
  }).catch(() => {});
}
