const VECTOR_SIZE = 128;
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

const normalize = (value) => (value || "").toLowerCase().trim();

function tokenize(value = "") {
  return (value.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (token) => token.length > 1 && !STOP_WORDS.has(token)
  );
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function embed(text) {
  const vector = new Array(VECTOR_SIZE).fill(0);
  for (const token of tokenize(text)) {
    const bucket = hashToken(token) % VECTOR_SIZE;
    vector[bucket] += token.length > 4 ? 2 : 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

function cosineSimilarity(a, b) {
  let sum = 0;
  for (let i = 0; i < VECTOR_SIZE; i += 1) sum += a[i] * b[i];
  return sum;
}

export function createVectorDbAdapter({ postgresAdapter }) {
  const embeddingCache = new Map();

  async function retrieveDocs({ query, applianceType, psNumber }) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    const queryEmbedding = embed(query);
    const docs = await postgresAdapter.listDocs({ applianceType, psNumber });

    return docs
      .map((doc) => {
        const key = `${doc.id}:${doc.updatedAt}`;
        if (!embeddingCache.has(key)) {
          embeddingCache.set(key, embed(`${doc.title} ${doc.content}`));
        }

        let score = cosineSimilarity(queryEmbedding, embeddingCache.get(key));
        if (normalizedQuery.includes(doc.docType.toLowerCase())) score += 0.1;
        if (psNumber && doc.partNumber === psNumber) score += 0.1;
        return { doc, score };
      })
      .sort((a, b) => b.score - a.score || b.doc.updatedAt.localeCompare(a.doc.updatedAt))
      .slice(0, 3)
      .map((item) => item.doc);
  }

  return {
    retrieveDocs
  };
}
