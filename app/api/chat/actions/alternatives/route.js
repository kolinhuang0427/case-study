import { NextResponse } from "next/server";
import { runTool } from "../../../../../lib/toolContracts";
import { trackEvent } from "../../../../../lib/telemetry";

const IN_SCOPE_APPLIANCES = new Set(["refrigerator", "dishwasher"]);

function isValidPsNumber(value = "") {
  return /^PS\d{6,}$/i.test(value);
}

export async function POST(request) {
  const body = await request.json();
  const applianceType = String(body?.applianceType || "").toLowerCase().trim();
  const modelNumber = String(body?.modelNumber || "").trim();
  const psNumber = String(body?.psNumber || "").toUpperCase();

  if (!applianceType || !IN_SCOPE_APPLIANCES.has(applianceType)) {
    return NextResponse.json({ error: "Action only supports refrigerator and dishwasher." }, { status: 400 });
  }
  if (!isValidPsNumber(psNumber)) {
    return NextResponse.json({ error: "Invalid psNumber." }, { status: 400 });
  }

  const partResult = await runTool("get_part_details", { psNumber });
  const basePart = partResult.data;
  const query = basePart ? `${basePart.name} replacement` : psNumber;
  const searchResult = await runTool("search_parts", { query, applianceType });
  const candidates = (searchResult.data || []).filter((part) => part.psNumber !== psNumber).slice(0, 4);

  const enriched = [];
  for (const part of candidates) {
    let compatibility = null;
    if (modelNumber) {
      const fitResult = await runTool("check_compatibility", {
        modelNumber,
        psNumber: part.psNumber
      });
      compatibility = fitResult.data;
    }

    if (modelNumber && compatibility && compatibility.compatible !== true) {
      continue;
    }

    enriched.push({
      ...part,
      compatibility: compatibility
        ? {
            modelNumber,
            psNumber: part.psNumber,
            fitConfidence: compatibility.fitConfidence,
            compatible: compatibility.compatible
          }
        : null
    });
  }

  trackEvent("alternatives_lookup", {
    applianceType,
    psNumber,
    modelNumber: modelNumber || null,
    candidateCount: enriched.length
  });

  return NextResponse.json({
    originalPsNumber: psNumber,
    alternatives: enriched
  });
}
