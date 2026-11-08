# ai-marketomg

Pilot agent tool for sales ops workflows: **daily reports** and **quote drafts**, with a human **approval gate** before any outbound action. MVP uses **mock CRM data** and a **stub send log** (no live email/CRM credentials).

## Quick start

```bash
npm install
npm run smoke          # end-to-end: report → approve → stub send + quote reject
npm run dev            # dashboard at http://localhost:3000
```

In the dashboard:

1. Click **Run daily report** (or draft a quote for a mock deal).
2. Open the pending approval and review the draft.
3. **Approve & stub send** appends to the send log (no real email).
4. **Reject** closes the run without sending.

CLI alternatives:

```bash
npm run run:report
npm run run:quote -- deal_brightline_pilot
```

## Layout

```
apps/dashboard          Minimal Next.js operator UI
packages/agent          runDailyReport / runQuoteDraft
packages/approvals      Pending/approved/rejected store + send stub
packages/crm-adapter    Thin CrmAdapter interface
packages/mock-crm       Fixture-backed mock implementation
packages/core           Shared types, pilot config, JSON file store
config/pilot.json       Single-pilot client config
data/                   Runtime state (runs, approvals, send-log)
```

## Architecture

```
Dashboard  →  Agent runtime  →  Approval gate  →  Stub send (log only)
                    ↓
              CRM adapter (mock)
```

- **Daily report** pulls mock activities + deals, drafts markdown, waits for approval.
- **Quote draft** loads a deal + contacts, drafts a quotation on the same approval/send path.
- Meeting scheduler is deferred (feature flag off in `config/pilot.json`).

## Mock CRM

Fixtures live under `packages/mock-crm/src/fixtures/` (contacts, deals, a week of activity). Swap later by implementing `CrmAdapter` for HubSpot / Pipedrive / Salesforce.

## Data & config

| Path | Purpose |
|------|---------|
| `config/pilot.json` | Client name, timezone, schedule cron, feature flags |
| `data/runs.json` | Run history |
| `data/approvals.json` | Approval decisions + draft snapshots |
| `data/send-log.json` | Append-only stub outbound log |

Override locations with `AI_MARKETOMG_ROOT`, `AI_MARKETOMG_DATA_DIR`, or `AI_MARKETOMG_PILOT_CONFIG` if needed.

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start dashboard |
| `npm run smoke` | Headless E2E against mock CRM |
| `npm run run:report` | Create a daily report run + pending approval |
| `npm run run:quote` | Create a quote draft for a deal id |
| `npm run build` | Production build of the dashboard |

## Out of scope (MVP)

Live email/calendar, live CRM write-back, multi-tenant self-serve, marketing optimization loops, voice outreach.
