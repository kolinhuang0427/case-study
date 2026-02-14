# PartSelect Chat Agent Case Study

This repo now contains a **Next.js App Router** implementation of a scoped e-commerce chat assistant focused on:

- Refrigerator parts and repair support
- Dishwasher parts and repair support
- Compatibility checks by model number
- Transactional support (add-to-cart stub + secure order support flow)

## Why this design

The assistant is intentionally narrow and reliable:

- It refuses out-of-scope requests and redirects users to in-scope workflows.
- It prioritizes model number capture for compatibility confidence.
- It returns structured responses with product cards, fit hints, install checklists, and source citations.
- It uses tool contracts (schema/auth/latency/fallback) to make backend integrations predictable.

## UX Features Implemented

- Guided context bar (appliance type + model number)
- Chat timeline with:
  - rich product cards (price, stock, shipping ETA)
  - compatibility actions
  - install checklists
  - source citation drawer
- Secure order support form separated from free-text chat
- Clickable quick actions that can set appliance context or trigger next workflow steps
- Architecture side panel explaining routing/tools/guardrails

## Backend Architecture (implemented as stubs you can replace)

### Intent router

`PART_LOOKUP`, `COMPATIBILITY_CHECK`, `INSTALL_GUIDE`, `TROUBLESHOOTING`, `ORDER_SUPPORT`, `OUT_OF_SCOPE`.

### Tool layer

- `searchParts` (token relevance scoring for natural-language symptoms)
- `getPartDetails`
- `checkCompatibility`
- `retrieveDocs`
- `buildInstallSteps`

### Tool contract layer

All tools now run through `lib/toolContracts.js`, which defines:

- JSON-schema input and output contracts
- Auth metadata (`required`, `level`)
- Latency budgets (`latencyBudgetMs`)
- Fallback policy per tool

Runtime behavior:

- Input/output validation is enforced before and after execution.
- Auth-required tools return deterministic fallback responses when unauthenticated.
- Timeout/failure paths are normalized into fallback output.
- `GET /api/chat` returns the registered tool contracts for inspection.

### Data sources

- Structured in-memory part catalog + model fit matrix (`lib/data.js`)
- Unstructured document snippets for install/troubleshooting citations (`lib/data.js`)

### APIs

- `POST /api/chat` - orchestrates intent + tools and returns structured message payloads
- `POST /api/order` - secure order support stub for `track`, `return`, and `cancel` actions

### Telemetry

`lib/telemetry.js` tracks turn-level events (intent, context presence).

## Project Structure

- `app/page.js` - main chat experience
- `app/api/chat/route.js` - chat agent endpoint
- `app/api/order/route.js` - order lookup endpoint
- `components/chat/*` - chat UI building blocks
- `lib/agent.js` - router + response composer
- `lib/tools.js` - tool registry handlers
- `lib/data.js` - mock structured and unstructured knowledge

## Run locally

```bash
npm install
cp .env.example .env.local
# set OPENAI_API_KEY in .env.local
npm run dev
```

Then open `http://localhost:3000`.

### OpenAI runtime behavior

- `POST /api/chat` now calls OpenAI Responses API to rewrite each assistant reply in real time.
- If `OPENAI_API_KEY` is missing or OpenAI call fails, the app falls back to deterministic response text from the local agent.
- You can override the model with `OPENAI_MODEL` (default: `gpt-5-nano-2025-08-07`).

## Automated E2E tests

The repository includes a Playwright end-to-end suite for required scenarios:

- Install guide lookup (`PS11752778`)
- Compatibility check (`WDT780SAEM1` + `PS11750057`)
- Ice maker troubleshooting flow
- Out-of-scope refusal behavior
- Secure order support return flow

Run:

```bash
npx playwright install chromium
npm run e2e
```

## How to test

Install deps:

```bash
npm install
```

Run lint/build sanity checks:

```bash
npm run lint
npm run build
```

Install Playwright browser (first time only):

```bash
npx playwright install chromium
```

Run the full automated E2E suite:

```bash
npm run e2e
```

Expected: `5 passed` (install, compatibility, troubleshooting, out-of-scope, order return).

Debug failures interactively (optional):

```bash
npm run e2e:headed
# or
npm run e2e:ui
```

Manually verify in browser (optional):

```bash
npm run dev
```

Open `http://localhost:3000` and test:

- `How can I install part number PS11752778?`
- `Is PS11750057 compatible with my WDT780SAEM1 model?`
- `The ice maker on my Whirlpool fridge is not working. How can I fix it?`
- Out-of-scope prompt like `Can you help fix my dryer?`

Verify CI on PR:

1. Push branch and open a PR.
2. In GitHub Actions, confirm workflow `E2E Tests` (`.github/workflows/e2e.yml`) is green.
3. If it fails, download the `playwright-report` artifact from the workflow run.

## Extending to production

- Replace `lib/data.js` with Postgres + vector DB adapters.
- Swap `lib/tools.js` handlers to call real services.
- Add authenticated customer session to `app/api/order/route.js`.
- Add streaming responses in `/api/chat`.
- Add offline evals for compatibility/install/troubleshooting accuracy.
