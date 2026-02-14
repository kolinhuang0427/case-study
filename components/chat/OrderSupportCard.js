"use client";

import { useState } from "react";

export default function OrderSupportCard() {
  const [action, setAction] = useState("track");
  const [orderId, setOrderId] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookupOrder() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, postalCode, action })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to look up order.");
        return;
      }
      setResult(data);
    } catch {
      setError("Unable to reach order support.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="order-support-card" className="order-support">
      <h3>Secure order support</h3>
      <p className="muted">Track status, start returns, and request order cancellation.</p>
      <div className="order-fields">
        <select value={action} onChange={(event) => setAction(event.target.value)}>
          <option value="track">Track order</option>
          <option value="return">Start return</option>
          <option value="cancel">Cancel order</option>
        </select>
        <input
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="Order ID"
        />
        <input
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          placeholder="Postal / ZIP code"
        />
        <button onClick={lookupOrder} disabled={loading}>
          {loading ? "Checking..." : "Submit"}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      {result ? (
        <div className="success-text">
          <p>
            Order {result.orderId}: {result.status.replace("_", " ")}
            {result.estimatedDelivery ? ` (ETA ${result.estimatedDelivery})` : ""}
          </p>
          <p>{result.message}</p>
        </div>
      ) : null}
    </section>
  );
}
