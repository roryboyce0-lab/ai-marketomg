# Vendored marketing skills (subset)

Pinned subset of [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) for ai-marketomg agent prompts.

| Field | Value |
|-------|-------|
| **Upstream** | https://github.com/coreyhaines31/marketingskills |
| **Pinned commit** | `96798cf38736ecdba015a1d2b0521b0c8f8f41dd` |
| **License** | MIT — see [LICENSE](./LICENSE) (Copyright 2025 Corey Haines) |
| **Scope** | Seven skills only; no CLIs, integrations, evals, or remaining skills |

## Skills included

| Skill | Upstream version (VERSIONS.md at pin) | Used by |
|-------|----------------------------------------|---------|
| `product-marketing` | 2.2.0 | Shared context (both workflows) |
| `revops` | 2.2.2 | Daily report |
| `sales-enablement` | 2.4.0 | Quote draft |
| `offers` | 1.0.3 | Quote draft (investment / value) |
| `copy-editing` | 2.2.1 | Final polish (both) |
| `emails` | 2.1.4 | Stub email wrap (both) |
| `marketing-loops` | 1.8.0 | Cadence + Tier 1/2 guardrail language |

Each folder keeps `SKILL.md` plus a small set of useful `references/` files. Upstream `evals/` and large/off-topic references (e.g. SEO operators, loop catalog) are intentionally omitted.

## Runtime adaptation

Upstream skills assume an interactive coding agent (“ask if not provided”). Our loaders bind answers from `config/pilot.json`, `.agents/product-marketing.md`, and CRM adapter data. Scheduled runs never wait on chat replies. Human approval before send stays in our approvals package (Tier 2), not in skill files.

## Refreshing the pin

```bash
# From a fresh clone of marketingskills at the desired SHA:
# copy the seven skill dirs (SKILL.md + chosen references), update this README SHA, keep LICENSE.
```
