"use client";

import { useMemo, useState } from "react";
import Composer from "../components/chat/Composer";
import MessageList from "../components/chat/MessageList";
import ModelContextBar from "../components/chat/ModelContextBar";
import OrderSupportCard from "../components/chat/OrderSupportCard";

const START_MESSAGE = {
  id: "m0",
  role: "assistant",
  content:
    "I can help with refrigerator and dishwasher parts, compatibility checks, install guidance, troubleshooting, and secure order support.",
  nextActions: ["Find a part", "Check compatibility", "Start repair guide", "Track order"]
};

export default function HomePage() {
  const [messages, setMessages] = useState([START_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [applianceType, setApplianceType] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [selectedPsNumber, setSelectedPsNumber] = useState("");

  const context = useMemo(
    () => ({
      applianceType,
      modelNumber,
      selectedPsNumber
    }),
    [applianceType, modelNumber, selectedPsNumber]
  );

  async function sendMessage(content) {
    if (loading) return;
    const userMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content
    };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, context })
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          ...data.response
        }
      ]);
      if (data.context) {
        setApplianceType(data.context.applianceType || "");
        setModelNumber(data.context.modelNumber || "");
        setSelectedPsNumber(data.context.selectedPsNumber || "");
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "I hit an error while processing that request. Please retry with appliance type, model number, and part number if available."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleCardAction(actionType, psNumber) {
    setSelectedPsNumber(psNumber);
    if (actionType === "check-fit") {
      sendMessage(`Is ${psNumber} compatible with my model?`);
      return;
    }
    if (actionType === "install") {
      sendMessage(`How can I install part number ${psNumber}?`);
      return;
    }
    if (actionType === "cart") {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Added ${psNumber} to cart (case-study stub). Replace this with commerce cart API integration.`,
          nextActions: ["Proceed to checkout", "Keep shopping"]
        }
      ]);
    }
  }

  function handleQuickAction(action) {
    if (action.startsWith("Set appliance:")) {
      const appliance = action.toLowerCase().includes("dishwasher") ? "dishwasher" : "refrigerator";
      setApplianceType(appliance);
      return;
    }

    if (action === "Open secure order lookup") {
      document.getElementById("order-support-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "Add to cart" && selectedPsNumber) {
      handleCardAction("cart", selectedPsNumber);
      return;
    }

    if (action === "Show install guide" && selectedPsNumber) {
      sendMessage(`How can I install part number ${selectedPsNumber}?`);
      return;
    }

    if (action === "Check fit" && selectedPsNumber) {
      sendMessage(`Is ${selectedPsNumber} compatible with my model?`);
      return;
    }

    const promptMap = {
      "Find a part": "Help me find the right part for my symptom.",
      "Check compatibility": "Please check compatibility for my part and model.",
      "Start repair guide": "Help me troubleshoot and repair this issue.",
      "Track order": "I need order support.",
      "I am stuck": "I am stuck on the install guide. What should I do next?",
      "Show related parts": "Show related parts.",
      "Show alternative parts": "Show alternative parts.",
      "Save this diagnosis": "Summarize this diagnosis so I can save it."
    };

    sendMessage(promptMap[action] || action);
  }

  return (
    <main className="page">
      <ModelContextBar
        applianceType={applianceType}
        modelNumber={modelNumber}
        onApplianceChange={setApplianceType}
        onModelChange={setModelNumber}
      />

      <div className="workspace">
        <section className="chat-panel">
          <MessageList
            messages={messages}
            modelNumber={modelNumber}
            onCardAction={handleCardAction}
            onQuickAction={handleQuickAction}
            quickActionsDisabled={loading}
          />
          <Composer onSend={sendMessage} disabled={loading} />
        </section>

        <aside className="side-panel">
          <OrderSupportCard />
          <section className="architecture-card">
            <h3>Architecture at a glance</h3>
            <ul>
              <li>Intent router: part lookup, fit, install, troubleshooting, order support.</li>
              <li>Tool layer: search, compatibility, docs retrieval, install checklist builder.</li>
              <li>Scope guardrails: only refrigerator and dishwasher support.</li>
              <li>Observability: per-turn telemetry for intent and outcomes.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
