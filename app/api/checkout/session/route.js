import { NextResponse } from "next/server";
import { trackEvent } from "../../../../lib/telemetry";

function isValidPsNumber(value = "") {
  return /^PS\d{6,}$/i.test(value);
}

export async function POST(request) {
  const body = await request.json();
  const psNumber = String(body?.psNumber || "").toUpperCase();
  const quantity = Number(body?.quantity || 0);

  if (!isValidPsNumber(psNumber) || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "Invalid checkout payload. Provide psNumber and quantity >= 1." },
      { status: 400 }
    );
  }

  trackEvent("checkout_session_created", { psNumber, quantity });

  return NextResponse.json({
    sessionId: `chk_${Date.now()}`,
    redirectUrl: `/checkout?part=${encodeURIComponent(psNumber)}&qty=${quantity}`,
    expiresInSeconds: 900
  });
}
