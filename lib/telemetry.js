export function trackEvent(eventName, payload = {}) {
  const event = {
    eventName,
    payload,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV !== "production") {
    // Console logging keeps the case study easy to inspect locally.
    // Replace with OpenTelemetry, Segment, or Datadog in production.
    console.log("[telemetry]", event);
  }

  return event;
}
