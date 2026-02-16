import { Pool } from "pg";
import { DOC_SNIPPETS, INSTALL_STEPS, MODEL_FITS, PARTS } from "../mockData";

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

function scoreByTokenOverlap(queryTokens, textBlob) {
  if (!queryTokens.length) return 0;
  const textTokens = new Set(tokenize(textBlob));
  return queryTokens.reduce(
    (score, token) => score + (textTokens.has(token) ? (token.length > 4 ? 2 : 1) : 0),
    0
  );
}

function toPart(row) {
  if (!row) return null;
  return {
    id: row.id,
    psNumber: row.ps_number,
    partNumber: row.part_number,
    name: row.name,
    applianceType: row.appliance_type,
    manufacturer: row.manufacturer,
    replaces: row.replaces || [],
    symptoms: row.symptoms || [],
    price: Number(row.price),
    inStock: Boolean(row.in_stock),
    shippingEta: row.shipping_eta
  };
}

function toFit(row) {
  if (!row) return null;
  return {
    modelNumber: row.model_number,
    psNumber: row.ps_number,
    fitConfidence: row.fit_confidence,
    notes: row.notes
  };
}

function toDoc(row) {
  if (!row) return null;
  return {
    id: row.id,
    applianceType: row.appliance_type,
    brand: row.brand,
    partNumber: row.part_number,
    docType: row.doc_type,
    title: row.title,
    url: row.url,
    content: row.content,
    updatedAt: row.updated_at
  };
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
  });
}

export function createPostgresAdapter() {
  const pool = createPool();
  let initPromise = null;

  async function ensureInitialized() {
    if (!pool) return;
    if (!initPromise) {
      initPromise = initializeSchemaAndSeed(pool);
    }
    await initPromise;
  }

  async function searchParts({ query, applianceType }) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    const queryTokens = tokenize(query);

    const parts = pool
      ? await queryPartsFromDb({
          pool,
          applianceType,
          ensureInitialized
        })
      : PARTS.filter((part) => (applianceType ? part.applianceType === applianceType : true));

    return parts
      .map((part) => {
        const textBlob = [
          part.psNumber,
          part.partNumber,
          part.name,
          part.manufacturer,
          ...(part.symptoms || [])
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
        for (const symptom of part.symptoms || []) {
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

  async function getPartDetails(psNumber) {
    const normalizedPs = normalize(psNumber);
    if (!normalizedPs) return null;

    if (!pool) {
      return PARTS.find((part) => part.psNumber.toLowerCase() === normalizedPs) || null;
    }

    await ensureInitialized();
    const result = await pool.query("SELECT * FROM parts WHERE LOWER(ps_number) = $1 LIMIT 1", [normalizedPs]);
    return toPart(result.rows[0]);
  }

  async function checkCompatibility({ modelNumber, psNumber }) {
    const normalizedModel = normalize(modelNumber);
    const normalizedPs = normalize(psNumber);
    if (!normalizedModel || !normalizedPs) return null;

    if (!pool) {
      return (
        MODEL_FITS.find(
          (item) =>
            item.modelNumber.toLowerCase() === normalizedModel && item.psNumber.toLowerCase() === normalizedPs
        ) || null
      );
    }

    await ensureInitialized();
    const result = await pool.query(
      `
        SELECT *
        FROM model_part_fits
        WHERE LOWER(model_number) = $1 AND LOWER(ps_number) = $2
        LIMIT 1
      `,
      [normalizedModel, normalizedPs]
    );
    return toFit(result.rows[0]);
  }

  async function getInstallSteps(psNumber) {
    const normalizedPs = normalize(psNumber);
    if (!normalizedPs) return [];

    if (!pool) {
      return INSTALL_STEPS[psNumber?.toUpperCase()] || [];
    }

    await ensureInitialized();
    const result = await pool.query(
      `
        SELECT step_text
        FROM install_steps
        WHERE LOWER(ps_number) = $1
        ORDER BY step_index ASC
      `,
      [normalizedPs]
    );
    return result.rows.map((row) => row.step_text);
  }

  async function listDocs({ applianceType, psNumber }) {
    if (!pool) {
      return DOC_SNIPPETS.filter((doc) => {
        const typeMatch = applianceType ? doc.applianceType === applianceType : true;
        const psMatch = psNumber ? doc.partNumber === psNumber || doc.partNumber === null : true;
        return typeMatch && psMatch;
      });
    }

    await ensureInitialized();
    const params = [];
    const conditions = [];

    if (applianceType) {
      params.push(applianceType);
      conditions.push(`appliance_type = $${params.length}`);
    }
    if (psNumber) {
      params.push(psNumber);
      conditions.push(`(part_number = $${params.length} OR part_number IS NULL)`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `
        SELECT *
        FROM docs
        ${whereClause}
      `,
      params
    );

    return result.rows.map(toDoc);
  }

  return {
    isConfigured: Boolean(pool),
    ensureInitialized,
    searchParts,
    getPartDetails,
    checkCompatibility,
    getInstallSteps,
    listDocs
  };
}

async function queryPartsFromDb({ pool, applianceType, ensureInitialized }) {
  await ensureInitialized();
  const params = [];
  const whereClause = applianceType ? `WHERE appliance_type = $1` : "";
  if (applianceType) params.push(applianceType);
  const result = await pool.query(
    `
      SELECT *
      FROM parts
      ${whereClause}
    `,
    params
  );
  return result.rows.map(toPart);
}

async function initializeSchemaAndSeed(pool) {
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY,
        ps_number TEXT NOT NULL UNIQUE,
        part_number TEXT NOT NULL,
        name TEXT NOT NULL,
        appliance_type TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        replaces TEXT[] NOT NULL DEFAULT '{}',
        symptoms TEXT[] NOT NULL DEFAULT '{}',
        price NUMERIC(10, 2) NOT NULL,
        in_stock BOOLEAN NOT NULL,
        shipping_eta TEXT NOT NULL
      );
    `
  );

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS model_part_fits (
        model_number TEXT NOT NULL,
        ps_number TEXT NOT NULL,
        fit_confidence TEXT NOT NULL,
        notes TEXT NOT NULL,
        PRIMARY KEY (model_number, ps_number)
      );
    `
  );

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS docs (
        id TEXT PRIMARY KEY,
        appliance_type TEXT NOT NULL,
        brand TEXT NOT NULL,
        part_number TEXT NULL,
        doc_type TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `
  );

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS install_steps (
        ps_number TEXT NOT NULL,
        step_index INT NOT NULL,
        step_text TEXT NOT NULL,
        PRIMARY KEY (ps_number, step_index)
      );
    `
  );

  for (const part of PARTS) {
    await pool.query(
      `
        INSERT INTO parts (
          id, ps_number, part_number, name, appliance_type, manufacturer,
          replaces, symptoms, price, in_stock, shipping_eta
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id)
        DO UPDATE SET
          ps_number = EXCLUDED.ps_number,
          part_number = EXCLUDED.part_number,
          name = EXCLUDED.name,
          appliance_type = EXCLUDED.appliance_type,
          manufacturer = EXCLUDED.manufacturer,
          replaces = EXCLUDED.replaces,
          symptoms = EXCLUDED.symptoms,
          price = EXCLUDED.price,
          in_stock = EXCLUDED.in_stock,
          shipping_eta = EXCLUDED.shipping_eta
      `,
      [
        part.id,
        part.psNumber,
        part.partNumber,
        part.name,
        part.applianceType,
        part.manufacturer,
        part.replaces,
        part.symptoms,
        part.price,
        part.inStock,
        part.shippingEta
      ]
    );
  }

  for (const fit of MODEL_FITS) {
    await pool.query(
      `
        INSERT INTO model_part_fits (model_number, ps_number, fit_confidence, notes)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (model_number, ps_number)
        DO UPDATE SET
          fit_confidence = EXCLUDED.fit_confidence,
          notes = EXCLUDED.notes
      `,
      [fit.modelNumber, fit.psNumber, fit.fitConfidence, fit.notes]
    );
  }

  for (const doc of DOC_SNIPPETS) {
    await pool.query(
      `
        INSERT INTO docs (id, appliance_type, brand, part_number, doc_type, title, url, content, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id)
        DO UPDATE SET
          appliance_type = EXCLUDED.appliance_type,
          brand = EXCLUDED.brand,
          part_number = EXCLUDED.part_number,
          doc_type = EXCLUDED.doc_type,
          title = EXCLUDED.title,
          url = EXCLUDED.url,
          content = EXCLUDED.content,
          updated_at = EXCLUDED.updated_at
      `,
      [
        doc.id,
        doc.applianceType,
        doc.brand,
        doc.partNumber,
        doc.docType,
        doc.title,
        doc.url,
        doc.content,
        doc.updatedAt
      ]
    );
  }

  for (const [psNumber, steps] of Object.entries(INSTALL_STEPS)) {
    for (const [index, step] of steps.entries()) {
      await pool.query(
        `
          INSERT INTO install_steps (ps_number, step_index, step_text)
          VALUES ($1,$2,$3)
          ON CONFLICT (ps_number, step_index)
          DO UPDATE SET step_text = EXCLUDED.step_text
        `,
        [psNumber, index, step]
      );
    }
  }
}
