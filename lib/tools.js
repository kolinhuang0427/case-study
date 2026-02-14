import { DOC_SNIPPETS, MODEL_FITS, PARTS } from "./data";

const normalize = (value) => (value || "").toLowerCase().trim();
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "for",
  "how",
  "i",
  "is",
  "it",
  "my",
  "of",
  "on",
  "the",
  "to",
  "with"
]);

function tokenize(value = "") {
  return (value.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (token) => token.length > 1 && !STOP_WORDS.has(token)
  );
}

function scoreByTokenOverlap(queryTokens, textBlob) {
  if (!queryTokens.length) return 0;
  const textTokens = new Set(tokenize(textBlob));
  return queryTokens.reduce(
    (score, token) => score + (textTokens.has(token) ? (token.length > 4 ? 2 : 1) : 0),
    0
  );
}

export function searchParts({ query, applianceType }) {
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);
  if (!normalizedQuery) return [];

  return PARTS.map((part) => {
    const typeMatch = applianceType ? part.applianceType === applianceType : true;
    if (!typeMatch) return null;

    const textBlob = [
      part.psNumber,
      part.partNumber,
      part.name,
      part.manufacturer,
      ...part.symptoms
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    if (part.psNumber.toLowerCase() === normalizedQuery || part.partNumber.toLowerCase() === normalizedQuery) {
      score += 100;
    }
    if (normalizedQuery.length >= 3 && textBlob.includes(normalizedQuery)) {
      score += 8;
    }
    score += scoreByTokenOverlap(queryTokens, textBlob);
    for (const symptom of part.symptoms) {
      if (normalizedQuery.includes(symptom.toLowerCase())) score += 5;
    }

    if (!score) return null;
    return { part, score };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || Number(b.part.inStock) - Number(a.part.inStock))
    .slice(0, 4)
    .map((item) => item.part);
}

export function getPartDetails(psNumber) {
  return PARTS.find((part) => part.psNumber.toLowerCase() === normalize(psNumber));
}

export function checkCompatibility({ modelNumber, psNumber }) {
  const fit = MODEL_FITS.find(
    (item) =>
      item.modelNumber.toLowerCase() === normalize(modelNumber) &&
      item.psNumber.toLowerCase() === normalize(psNumber)
  );
  if (!fit) {
    return {
      compatible: false,
      fitConfidence: "low",
      notes:
        "No exact compatibility record found in the current dataset. Confirm model and serial before ordering."
    };
  }
  return {
    compatible: fit.fitConfidence !== "low",
    fitConfidence: fit.fitConfidence,
    notes: fit.notes
  };
}

export function retrieveDocs({ query, applianceType, psNumber }) {
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);
  if (!normalizedQuery) return [];

  return DOC_SNIPPETS.map((doc) => {
    const typeMatch = applianceType ? doc.applianceType === applianceType : true;
    const psMatch = psNumber ? doc.partNumber === psNumber || doc.partNumber === null : true;
    if (!typeMatch || !psMatch) return null;

    const textBlob = `${doc.title} ${doc.content}`.toLowerCase();
    let score = 0;
    if (normalizedQuery.length >= 3 && textBlob.includes(normalizedQuery)) score += 8;
    if (normalizedQuery.includes(doc.docType.toLowerCase())) score += 4;
    score += scoreByTokenOverlap(queryTokens, textBlob);
    if (psNumber && doc.partNumber === psNumber) score += 4;
    if (!score) return null;

    return { doc, score };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.doc.updatedAt.localeCompare(a.doc.updatedAt))
    .slice(0, 3)
    .map((item) => item.doc);
}

export function buildInstallSteps({ psNumber }) {
  if (normalize(psNumber) === "ps11752778") {
    return [
      "Unplug refrigerator and shut off water supply.",
      "Remove ice bin and mounting hardware from the ice maker housing.",
      "Disconnect wire harness and release the old ice maker assembly.",
      "Install new assembly, reconnect harness, and secure all screws.",
      "Restore power/water and run a test harvest cycle."
    ];
  }

  if (normalize(psNumber) === "ps11750057") {
    return [
      "Disconnect dishwasher power and water supply.",
      "Remove lower kick plate to access inlet valve.",
      "Disconnect inlet hose and wire terminals from old valve.",
      "Install new valve, reconnect wiring/hose, and tighten fittings.",
      "Restore utilities and run a short cycle to check leaks."
    ];
  }

  if (normalize(psNumber) === "ps12584610") {
    return [
      "Disconnect dishwasher power and water supply.",
      "Remove lower rack, spray arm, and filter assembly to access the sump.",
      "Disconnect motor wiring harness and attached hoses from the old pump assembly.",
      "Install the new pump and motor assembly and resecure all clamps and connectors.",
      "Restore utilities and run a short wash/drain cycle to verify operation and leaks."
    ];
  }

  if (normalize(psNumber) === "ps11722128") {
    return [
      "Unplug refrigerator and shut off water supply.",
      "Pull the unit out and remove the lower rear service panel.",
      "Disconnect inlet/outlet water lines and wire harness from the old valve.",
      "Install new valve, reconnect all lines and wiring, and secure the panel.",
      "Turn water back on, restore power, and check for leaks and dispenser flow."
    ];
  }

  return [];
}
