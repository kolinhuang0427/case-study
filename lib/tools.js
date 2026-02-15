import {
  buildInstallSteps as buildInstallStepsFromStore,
  checkCompatibility as checkCompatibilityFromStore,
  getPartDetails as getPartDetailsFromStore,
  retrieveDocs as retrieveDocsFromStore,
  searchParts as searchPartsFromStore
} from "./data";

export async function searchParts({ query, applianceType }) {
  return searchPartsFromStore({ query, applianceType });
}

export async function getPartDetails(psNumber) {
  return getPartDetailsFromStore(psNumber);
}

export async function checkCompatibility({ modelNumber, psNumber }) {
  const fit = await checkCompatibilityFromStore({ modelNumber, psNumber });
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
  return retrieveDocsFromStore({ query, applianceType, psNumber });
}

export async function buildInstallSteps({ psNumber }) {
  return buildInstallStepsFromStore({ psNumber });
}
