import { NextResponse } from "next/server";
import { trackEvent } from "../../../lib/telemetry";

export async function POST(request) {
  const body = await request.json();
  const orderId = body?.orderId || "";
  const postalCode = body?.postalCode || "";
  const action = body?.action || "track";

  if (!["track", "return", "cancel"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid order support action. Use track, return, or cancel." },
      { status: 400 }
    );
  }

  if (!orderId || !postalCode) {
    return NextResponse.json(
      { error: "Missing order ID or postal code." },
      { status: 400 }
    );
  }

  trackEvent("order_lookup", {
    action,
    orderIdLast4: orderId.slice(-4),
    postalCodePrefix: postalCode.slice(0, 3)
  });

  const actionResponse = {
    track: {
      status: "in_transit",
      estimatedDelivery: "2026-02-18",
      message:
        "Tracking is stubbed in this case study. Replace this route with your commerce backend integration."
    },
    return: {
      status: "return_requested",
      message:
        "Return flow is stubbed. In production this should create an RMA and send return-label instructions."
    },
    cancel: {
      status: "cancel_pending_review",
      message:
        "Cancellation flow is stubbed. In production this should validate fulfillment state before cancellation."
    }
  }[action];

  return NextResponse.json({
    orderId,
    action,
    ...actionResponse
  });
}
