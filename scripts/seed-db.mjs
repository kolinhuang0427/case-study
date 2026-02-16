import { ensureDataStoresReady } from "../lib/data.js";

async function run() {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL is not set. Skipping Postgres seed.");
      process.exit(0);
    }

    await ensureDataStoresReady();
    console.log("Postgres schema and mock data are ready.");
  } catch (error) {
    console.error("Failed to seed Postgres:", error?.message || error);
    process.exit(1);
  }
}

run();
