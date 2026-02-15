import { createPostgresAdapter } from "./adapters/postgres";
import { createVectorDbAdapter } from "./adapters/vectorDb";

const postgresAdapter = createPostgresAdapter();
const vectorDbAdapter = createVectorDbAdapter({ postgresAdapter });

export async function searchParts(params) {
  return postgresAdapter.searchParts(params);
}

export async function getPartDetails(psNumber) {
  return postgresAdapter.getPartDetails(psNumber);
}

export async function checkCompatibility(params) {
  return postgresAdapter.checkCompatibility(params);
}

export async function retrieveDocs(params) {
  return vectorDbAdapter.retrieveDocs(params);
}

export async function buildInstallSteps(params) {
  return postgresAdapter.getInstallSteps(params?.psNumber);
}

export async function ensureDataStoresReady() {
  await postgresAdapter.ensureInitialized();
}
