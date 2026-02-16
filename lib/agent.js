import { runTool } from "./toolContracts";

const IN_SCOPE_APPLIANCES = new Set(["refrigerator", "dishwasher"]);
const OUT_OF_SCOPE_APPLIANCE_HINTS = [
  "washer",
  "dryer",
  "oven",
  "range",
  "stove",
  "cooktop",
  "microwave",
  "air conditioner",
  "furnace"
];
const IN_SCOPE_HINTS = [
  "refrigerator",
  "fridge",
  "dishwasher",
  "part",
  "compatible",
  "fit",
  "install",
  "replace",
  "repair",
  "troubleshoot",
  "not working",
  "ice maker",
  "order",
  "return",
  "cancel",
  "track"
];

function extractPsNumber(text = "") {
  const match = text.toUpperCase().match(/PS\d{6,}/);
  return match?.[0] || null;
}

function extractModelNumber(text = "") {
  const candidates = text.toUpperCase().match(/[A-Z0-9-]{7,16}/g) || [];
  return (
    candidates.find(
      (token) => /[A-Z]/.test(token) && /\d/.test(token) && !token.startsWith("PS")
    ) || null
  );
}

function extractApplianceType(text = "") {
  const q = text.toLowerCase();
  if (q.includes("dishwasher") || q.includes("dish washer")) return "dishwasher";
  if (q.includes("refrigerator") || q.includes("fridge")) return "refrigerator";
  return null;
}

function inferApplianceType(rawApplianceType, message) {
  const normalized = (rawApplianceType || "").toLowerCase().trim();
  if (IN_SCOPE_APPLIANCES.has(normalized)) return normalized;
  return extractApplianceType(message);
}

function isInScopeMessage(message = "") {
  const q = message.toLowerCase().trim();
  if (!q) return true;

  const hasInScopeApplianceMention = /(?:\bfridge\b|\brefrigerator\b|\bdishwasher\b|\bdish washer\b)/.test(q);
  if (!hasInScopeApplianceMention) {
    const hasOutOfScopeApplianceMention = OUT_OF_SCOPE_APPLIANCE_HINTS.some((term) =>
      new RegExp(`\\b${term}\\b`).test(q)
    );
    if (hasOutOfScopeApplianceMention) return false;
  }

  if (extractPsNumber(q) || extractModelNumber(q)) return true;
  return IN_SCOPE_HINTS.some((term) => q.includes(term));
}

export function classifyIntent(message) {
  const q = (message || "").toLowerCase();
  if (
    q.includes("track") ||
    q.includes("return") ||
    q.includes("cancel") ||
    q.includes("refund") ||
    q.includes("order")
  ) {
    return "ORDER_SUPPORT";
  }
  if (q.includes("compatible") || q.includes("fit") || q.includes("works with")) return "COMPATIBILITY_CHECK";
  if (q.includes("install") || q.includes("replace") || q.includes("remove")) return "INSTALL_GUIDE";
  if (
    q.includes("not working") ||
    q.includes("fix") ||
    q.includes("troubleshoot") ||
    q.includes("no ice") ||
    q.includes("leak") ||
    q.includes("noise")
  ) {
    return "TROUBLESHOOTING";
  }
  if (q.includes("ps") || q.includes("part")) return "PART_LOOKUP";
  return "PART_LOOKUP";
}

function outOfScopeMessage() {
  return {
    role: "assistant",
    content:
      "I can only assist with refrigerator and dishwasher parts, compatibility checks, repair steps, and order support. Share your appliance type, model number, or PS part number and I can help right away.",
    nextActions: ["Find a part", "Check compatibility", "Start repair guide", "Track order"]
  };
}

function createSource(doc) {
  return {
    id: doc.id,
    title: doc.title,
    url: doc.url,
    docType: doc.docType,
    updatedAt: doc.updatedAt
  };
}

function addAction(actions, action) {
  if (!action || actions.length >= 3) return;
  if (action.style === "primary" && actions.some((item) => item.style === "primary")) return;
  actions.push(action);
}

function buildResponseActions({
  intent,
  applianceType,
  modelNumber,
  psNumber,
  compatibility,
  part,
  wantsAlternatives
}) {
  if (!applianceType || !IN_SCOPE_APPLIANCES.has(applianceType)) return [];
  const actions = [];
  const normalizedPs = psNumber || part?.psNumber || "";

  const canCheckout =
    intent === "COMPATIBILITY_CHECK" &&
    compatibility?.compatible &&
    compatibility?.fitConfidence !== "low" &&
    part?.inStock &&
    normalizedPs;

  if (canCheckout) {
    addAction(actions, {
      id: `checkout_${normalizedPs.toLowerCase()}`,
      type: "checkout_now",
      label: "Checkout now",
      style: "primary",
      payload: {
        psNumber: normalizedPs,
        quantity: 1
      },
      requiresConfirmation: true,
      enabled: true
    });
  }

  const shouldShowAlternatives =
    Boolean(normalizedPs) &&
    (Boolean(wantsAlternatives) ||
      (intent === "COMPATIBILITY_CHECK" &&
        compatibility &&
        (compatibility.fitConfidence === "low" || !compatibility.compatible)) ||
      Boolean(part && !part.inStock));
  if (shouldShowAlternatives) {
    addAction(actions, {
      id: `alternatives_${normalizedPs.toLowerCase()}`,
      type: "check_compatible_alternatives",
      label: "Show compatible alternatives",
      style: "secondary",
      payload: {
        modelNumber: modelNumber || "",
        psNumber: normalizedPs,
        applianceType
      },
      enabled: true
    });
  }

  if (normalizedPs && part && !part.inStock) {
    addAction(actions, {
      id: `notify_${normalizedPs.toLowerCase()}`,
      type: "notify_when_in_stock",
      label: "Notify me when in stock",
      style: "secondary",
      payload: {
        psNumber: normalizedPs,
        channel: "email"
      },
      enabled: true
    });
  }

  return actions;
}

async function callTool(toolCalls, name, input) {
  const result = await runTool(name, input, { authContext: { isAuthenticated: false } });
  toolCalls.push({
    name: result.toolName,
    status: result.status,
    error: result.error,
    latencyBudgetMs: result.contract?.latencyBudgetMs,
    authRequired: result.contract?.auth?.required
  });
  return result.data;
}

export async function handleChatTurn({ message, context }) {
  const userMessage = (message || "").trim();
  const intent = classifyIntent(userMessage);
  let applianceType = inferApplianceType(context?.applianceType, userMessage);
  const modelNumberFromMessage = extractModelNumber(userMessage);
  const psNumberFromMessage = extractPsNumber(userMessage);
  const modelNumber = modelNumberFromMessage || context?.modelNumber || null;
  const psNumber = psNumberFromMessage || context?.selectedPsNumber || null;
  const wantsAlternatives = /alternative|another option|other option|substitute/i.test(userMessage);
  const toolCalls = [];
  let partFromPsNumber = null;

  if (psNumber) {
    partFromPsNumber = await callTool(toolCalls, "get_part_details", { psNumber });
    if (partFromPsNumber?.applianceType) {
      applianceType = partFromPsNumber.applianceType;
    }
  }

  if (!isInScopeMessage(userMessage)) {
    return {
      intent: "OUT_OF_SCOPE",
      response: outOfScopeMessage(),
      context: { ...context, applianceType: applianceType || "", modelNumber: modelNumber || "" },
      toolCalls
    };
  }

  if (applianceType && !IN_SCOPE_APPLIANCES.has(applianceType)) {
    return {
      intent: "OUT_OF_SCOPE",
      response: outOfScopeMessage(),
      context: { ...context, applianceType: "", modelNumber: modelNumber || "" },
      toolCalls
    };
  }

  if (!applianceType) {
    return {
      intent,
      context: { ...context, modelNumber: modelNumber || context?.modelNumber || "", applianceType: "" },
      response: {
        role: "assistant",
        content:
          "Before we dive in, are you working on a refrigerator or a dishwasher? If you have your model number, share it so I can verify fit and pull exact instructions.",
        nextActions: ["Set appliance: Refrigerator", "Set appliance: Dishwasher"]
      },
      toolCalls
    };
  }

  if (!IN_SCOPE_APPLIANCES.has(applianceType)) {
    return { intent: "OUT_OF_SCOPE", response: outOfScopeMessage(), context, toolCalls };
  }

  if (intent === "ORDER_SUPPORT") {
    return {
      intent,
      context: { ...context, applianceType, modelNumber: modelNumber || context?.modelNumber || "" },
      response: {
        role: "assistant",
        content:
          "I can help with order support. For privacy, use the secure order form to track status, start a return, or request cancellation.",
        nextActions: ["Open secure order lookup"]
      },
      toolCalls
    };
  }

  if (intent === "COMPATIBILITY_CHECK") {
    if (!psNumber) {
      const suggestions = await callTool(toolCalls, "search_parts", {
        query: userMessage,
        applianceType
      });
      return {
        intent,
        context: {
          ...context,
          applianceType,
          modelNumber: modelNumber || context?.modelNumber || ""
        },
        response: {
          role: "assistant",
          content: "I can check fit right away. Which part number are you checking?",
          parts: suggestions || [],
          nextActions: ["Use a suggested part", "Enter a PS number"]
        },
        toolCalls
      };
    }

    if (!modelNumber) {
      return {
        intent,
        context: { ...context, applianceType, selectedPsNumber: psNumber },
        response: {
          role: "assistant",
          content: `Got it, checking ${psNumber}. Share your model number to confirm compatibility.`,
          nextActions: ["Enter model number", "Where to find model number"]
        },
        toolCalls
      };
    }

    const fit = await callTool(toolCalls, "check_compatibility", {
      modelNumber,
      psNumber
    });
    const part = partFromPsNumber || (await callTool(toolCalls, "get_part_details", { psNumber }));
    const compatibility = {
      modelNumber,
      psNumber,
      fitConfidence: fit?.fitConfidence || "low",
      compatible: Boolean(fit?.compatible)
    };
    const partWithCompatibility = part ? { ...part, compatibility } : null;
    return {
      intent,
      context: { ...context, applianceType, modelNumber, selectedPsNumber: psNumber },
      response: {
        role: "assistant",
        content: fit?.compatible
          ? `${psNumber} is compatible with ${modelNumber}. ${fit.notes}`
          : `I could not confirm exact fit for ${modelNumber} and ${psNumber}. ${fit?.notes || "Please verify manually."}`,
        parts: partWithCompatibility ? [partWithCompatibility] : [],
        actions: buildResponseActions({
          intent,
          applianceType,
          modelNumber,
          psNumber,
          compatibility,
          part,
          wantsAlternatives
        }),
        compatibility,
        nextActions: fit?.compatible ? ["Add to cart", "Show install guide"] : ["Show alternative parts"]
      },
      toolCalls
    };
  }

  if (intent === "INSTALL_GUIDE") {
    if (!psNumber) {
      return {
        intent,
        context: { ...context, applianceType, modelNumber: modelNumber || context?.modelNumber || "" },
        response: {
          role: "assistant",
          content: "Share the part number (for example PS11752778) and I will generate a step-by-step install checklist.",
          nextActions: ["Enter part number"]
        },
        toolCalls
      };
    }

    const steps = await callTool(toolCalls, "build_install_steps", { psNumber });
    let docs = await callTool(toolCalls, "retrieve_docs", {
      query: "installation",
      applianceType,
      psNumber
    });

    if (!docs.length && partFromPsNumber?.applianceType && partFromPsNumber.applianceType !== applianceType) {
      docs = await callTool(toolCalls, "retrieve_docs", {
        query: "installation",
        applianceType: partFromPsNumber.applianceType,
        psNumber
      });
    }
    if (!steps.length || !docs.length) {
      return {
        intent,
        context: { ...context, applianceType, selectedPsNumber: psNumber },
        response: {
          role: "assistant",
          content:
            "I could not retrieve enough trusted documentation for a full install walk-through yet. I can still help you search by exact model and part number.",
          nextActions: ["Search by model number", "Find compatible part"]
        },
        toolCalls
      };
    }

    return {
      intent,
      context: { ...context, applianceType, selectedPsNumber: psNumber },
      response: {
        role: "assistant",
        content: `Here is the install checklist for ${psNumber}. Follow each step in order and confirm power/water are disconnected first.`,
        checklist: steps,
        citations: docs.map(createSource),
        nextActions: ["I am stuck", "Show related parts", "Check compatibility"]
      },
      toolCalls
    };
  }

  if (intent === "TROUBLESHOOTING") {
    const docs = await callTool(toolCalls, "retrieve_docs", {
      query: userMessage,
      applianceType
    });
    const recommendedParts = await callTool(toolCalls, "search_parts", {
      query: userMessage,
      applianceType
    });

    const hasSignals = Boolean((docs || []).length || (recommendedParts || []).length);

    return {
      intent,
      context: { ...context, applianceType, modelNumber: modelNumber || context?.modelNumber || "" },
      response: {
        role: "assistant",
        content: hasSignals
          ? "For this symptom, start with water supply and filter checks, then test the inlet valve, then inspect the target assembly and related sensors. I included matched references and likely replacement parts below."
          : "I can help troubleshoot, but I need a bit more detail. Share the exact symptom, part number, or model number so I can pull targeted guidance.",
        citations: (docs || []).map(createSource),
        parts: recommendedParts || [],
        actions: buildResponseActions({
          intent,
          applianceType,
          modelNumber,
          psNumber: recommendedParts?.[0]?.psNumber || psNumber,
          part: recommendedParts?.[0] || null,
          wantsAlternatives
        }),
        nextActions: ["Check compatibility", "Start repair guide", "Save this diagnosis"]
      },
      toolCalls
    };
  }

  const matches = await callTool(toolCalls, "search_parts", {
    query: userMessage,
    applianceType
  });
  return {
    intent: "PART_LOOKUP",
    context: { ...context, applianceType, modelNumber: modelNumber || context?.modelNumber || "" },
    response: {
      role: "assistant",
      content: (matches || []).length
        ? "I found parts that match your request."
        : "I did not find an exact match yet. Try the symptom, part number, or model number.",
      parts: matches || [],
      actions: buildResponseActions({
        intent: "PART_LOOKUP",
        applianceType,
        modelNumber,
        psNumber: matches?.[0]?.psNumber || psNumber,
        part: matches?.[0] || null,
        wantsAlternatives
      }),
      nextActions: ["Check fit", "Add to cart", "Start repair guide"]
    },
    toolCalls
  };
}
