import { NextResponse } from "next/server";
import { trackEvent } from "../../../../lib/telemetry";

function isValidPsNumber(value = "") {
  return /^PS\d{6,}$/i.test(value);
}

function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  const body = await request.json();
  const psNumber = String(body?.psNumber || "").toUpperCase();
  const channel = String(body?.channel || "email").toLowerCase();
  const email = String(body?.email || "").trim();
  const isAuthenticated = Boolean(body?.isAuthenticated);

  if (!isValidPsNumber(psNumber)) {
    return NextResponse.json({ error: "Invalid psNumber." }, { status: 400 });
  }
  if (channel !== "email") {
    return NextResponse.json({ error: "Only email channel is supported in this case study." }, { status: 400 });
  }
  if (!isAuthenticated && !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email when you are not authenticated." },
      { status: 400 }
    );
  }

  trackEvent("back_in_stock_subscribed", {
    psNumber,
    channel,
    isAuthenticated
  });

  return NextResponse.json({
    status: "subscribed",
    psNumber,
    channel,
    message: `You are subscribed for in-stock alerts on ${psNumber}.`
  });
}
