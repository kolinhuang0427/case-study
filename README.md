# PartSelect Chat Agent Case Study

This repo now contains a **Next.js App Router** implementation of a scoped e-commerce chat assistant focused on:

- Refrigerator parts and repair support
- Dishwasher parts and repair support
- Compatibility checks by model number
- Transactional support (add-to-cart stub + secure order support flow)

## Why this design

The assistant is intentionally narrow and reliable:

- It refuses out-of-scope appliance categories and redirects users to in-scope workflows.
- It prioritizes model number capture for compatibility confidence.
- It returns structured responses with product cards, fit hints, install checklists, and source citations.

## UX Features Implemented

- Guided context bar (appliance type + model number)
- Chat timeline with:
  - rich product cards (price, stock, shipping ETA)
  - compatibility actions
  - install checklists
  - source citation drawer
- Secure order support form separated from free-text chat
- Architecture side panel explaining routing/tools/guardrails

## Backend Architecture (implemented as stubs you can replace)

### Intent router

`PART_LOOKUP`, `COMPATIBILITY_CHECK`, `INSTALL_GUIDE`, `TROUBLESHOOTING`, `ORDER_SUPPORT`, `OUT_OF_SCOPE`.

### Tool layer

- `searchParts`
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
- `POST /api/order` - secure order support stub (replace with commerce backend)

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
npm run dev
```

Then open `http://localhost:3000`.

## Extending to production

- Replace `lib/data.js` with Postgres + vector DB adapters.
- Swap `lib/tools.js` handlers to call real services.
- Add authenticated customer session to `app/api/order/route.js`.
- Add streaming responses in `/api/chat`.
- Add offline evals for compatibility/install/troubleshooting accuracy.
