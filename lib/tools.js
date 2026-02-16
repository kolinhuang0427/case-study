import {
  buildInstallSteps as buildInstallStepsFromStore,
  checkCompatibility as checkCompatibilityFromStore,
  getPartDetails as getPartDetailsFromStore,
  retrieveDocs as retrieveDocsFromStore,
  searchParts as searchPartsFromStore
} from "./data";
import {
  buildInstallStepsService,
  checkCompatibilityService,
  getPartDetailsService,
  retrieveDocsService,
  searchPartsService
} from "./services/toolServiceClient";

export async function searchParts({ query, applianceType }) {
  try {
    const remote = await searchPartsService({ query, applianceType });
    if (Array.isArray(remote)) return remote;
  } catch (_error) {
    // Fall through to local adapter for resiliency.
  }
  return searchPartsFromStore({ query, applianceType });
}

export async function getPartDetails(psNumber) {
  try {
    const remote = await getPartDetailsService(psNumber);
    if (remote && typeof remote === "object") return remote;
  } catch (_error) {
    // Fall through to local adapter for resiliency.
  }
  return getPartDetailsFromStore(psNumber);
}

export async function checkCompatibility({ modelNumber, psNumber }) {
  let fit = null;
  try {
    const remote = await checkCompatibilityService({ modelNumber, psNumber });
    if (remote && typeof remote === "object") fit = remote;
  } catch (_error) {
    // Fall through to local adapter for resiliency.
  }
  if (!fit) {
    fit = await checkCompatibilityFromStore({ modelNumber, psNumber });
  }
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

export async function retrieveDocs({ query, applianceType, psNumber }) {
  try {
    const remote = await retrieveDocsService({ query, applianceType, psNumber });
    if (Array.isArray(remote)) return remote;
  } catch (_error) {
    // Fall through to local adapter for resiliency.
  }
  return retrieveDocsFromStore({ query, applianceType, psNumber });
}

export async function buildInstallSteps({ psNumber }) {
  try {
    const remote = await buildInstallStepsService({ psNumber });
    if (Array.isArray(remote)) return remote;
  } catch (_error) {
    // Fall through to local adapter for resiliency.
  }
  return buildInstallStepsFromStore({ psNumber });
}
