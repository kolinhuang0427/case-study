const DEFAULT_TIMEOUT_MS = Number(process.env.TOOL_SERVICE_TIMEOUT_MS || 900);

function withTimeout(ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const apiKey = process.env.TOOL_SERVICE_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

function getCatalogBaseUrl() {
  return process.env.CATALOG_SERVICE_URL || "";
}

function getDocsBaseUrl() {
  return process.env.DOCS_SERVICE_URL || "";
}

async function requestJson(url, { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { controller, timeoutId } = withTimeout(timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Service request failed (${response.status}) for ${url}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchPartsService({ query, applianceType }) {
  const baseUrl = getCatalogBaseUrl();
  if (!baseUrl) return null;
  return requestJson(`${baseUrl}/parts/search`, {
    method: "POST",
    body: { query, applianceType }
  });
}

export async function getPartDetailsService(psNumber) {
  const baseUrl = getCatalogBaseUrl();
  if (!baseUrl) return null;
  return requestJson(`${baseUrl}/parts/${encodeURIComponent(psNumber)}`);
}

export async function checkCompatibilityService({ modelNumber, psNumber }) {
  const baseUrl = getCatalogBaseUrl();
  if (!baseUrl) return null;
  return requestJson(`${baseUrl}/compatibility/check`, {
    method: "POST",
    body: { modelNumber, psNumber }
  });
}

export async function retrieveDocsService({ query, applianceType, psNumber }) {
  const baseUrl = getDocsBaseUrl();
  if (!baseUrl) return null;
  return requestJson(`${baseUrl}/docs/retrieve`, {
    method: "POST",
    body: { query, applianceType, psNumber: psNumber || null }
  });
}

export async function buildInstallStepsService({ psNumber }) {
  const baseUrl = getCatalogBaseUrl();
  if (!baseUrl) return null;
  return requestJson(`${baseUrl}/parts/${encodeURIComponent(psNumber)}/install-steps`);
}
