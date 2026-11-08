import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, type PilotConfig } from "@ai-marketomg/core";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Vendored skills live next to the agent package (packages/agent/skills). */
export const SKILLS_ROOT = path.resolve(here, "../../skills");

export const PINNED_UPSTREAM_SHA = "96798cf38736ecdba015a1d2b0521b0c8f8f41dd";

export type SkillName =
  | "product-marketing"
  | "sales-enablement"
  | "revops"
  | "copy-editing"
  | "emails"
  | "marketing-loops"
  | "offers";

export interface LoadedSkill {
  name: SkillName;
  skillMarkdown: string;
  references: Record<string, string>;
}

const WORKFLOW_SKILLS = {
  daily_report: [
    "product-marketing",
    "revops",
    "copy-editing",
    "emails",
    "marketing-loops",
  ] as const satisfies readonly SkillName[],
  quote_draft: [
    "product-marketing",
    "sales-enablement",
    "offers",
    "copy-editing",
    "emails",
    "marketing-loops",
  ] as const satisfies readonly SkillName[],
} as const;

export type WorkflowSkillKey = keyof typeof WORKFLOW_SKILLS;

function skillDir(name: SkillName): string {
  return path.join(SKILLS_ROOT, name);
}

export function loadSkill(name: SkillName): LoadedSkill {
  const dir = skillDir(name);
  const skillPath = path.join(dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    throw new Error(`Missing vendored skill: ${name} (${skillPath})`);
  }

  const skillMarkdown = readFileSync(skillPath, "utf8");
  const references: Record<string, string> = {};
  const refsDir = path.join(dir, "references");
  if (existsSync(refsDir)) {
    for (const file of readdirSync(refsDir)) {
      if (!file.endsWith(".md")) continue;
      references[file] = readFileSync(path.join(refsDir, file), "utf8");
    }
  }

  return { name, skillMarkdown, references };
}

export function loadSkillsForWorkflow(
  workflow: WorkflowSkillKey
): LoadedSkill[] {
  return WORKFLOW_SKILLS[workflow].map((name) => loadSkill(name));
}

export function loadProductMarketingContext(): string {
  const candidates = [
    path.join(REPO_ROOT, ".agents", "product-marketing.md"),
    path.join(REPO_ROOT, ".claude", "product-marketing.md"),
    path.join(REPO_ROOT, "product-marketing-context.md"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf8");
    }
  }
  return "";
}

/**
 * Build the system-prompt module stack for a workflow.
 * Interactive “ask the user” instructions are overridden: use pilot config,
 * product-marketing context, and CRM tool results; never block a scheduled run.
 */
export function buildWorkflowPromptModules(input: {
  workflow: WorkflowSkillKey;
  config: PilotConfig;
  /** Extra CRM / deal facts already gathered by the workflow. */
  crmFactsMarkdown?: string;
}): {
  skillsLoaded: SkillName[];
  systemPrompt: string;
  productMarketingContext: string;
} {
  const skills = loadSkillsForWorkflow(input.workflow);
  const productMarketingContext = loadProductMarketingContext();

  const parts: string[] = [
    `# ai-marketomg agent prompt — ${input.workflow}`,
    "",
    "## Runtime rules (override upstream interactive asks)",
    "",
    "- Do **not** ask clarifying questions or wait for chat replies.",
    "- Bind missing context from `config/pilot.json`, `.agents/product-marketing.md`, and CRM adapter results already provided below.",
    "- If a detail is still unknown, omit that section or mark it `TBD` — never invent proof points, prices, or customer claims.",
    "- Tier 2 outbound (email/send) must remain staged for human approval; stub send only after approve.",
    `- Upstream skills pinned at commit \`${PINNED_UPSTREAM_SHA}\`.`,
    "",
    "## Pilot config",
    "",
    "```json",
    JSON.stringify(
      {
        clientId: input.config.clientId,
        clientName: input.config.clientName,
        timezone: input.config.timezone,
        report: input.config.report,
        quote: input.config.quote,
        send: input.config.send,
      },
      null,
      2
    ),
    "```",
    "",
    "## Product marketing context",
    "",
    productMarketingContext.trim() ||
      "_No `.agents/product-marketing.md` found — rely on pilot config + CRM only._",
    "",
  ];

  if (input.crmFactsMarkdown?.trim()) {
    parts.push("## CRM facts for this run", "", input.crmFactsMarkdown.trim(), "");
  }

  for (const skill of skills) {
    parts.push(
      `## Skill module: ${skill.name}`,
      "",
      skill.skillMarkdown.trim(),
      ""
    );
    const refNames = Object.keys(skill.references).sort();
    for (const ref of refNames) {
      parts.push(
        `### Reference: ${skill.name}/references/${ref}`,
        "",
        skill.references[ref]!.trim(),
        ""
      );
    }
  }

  return {
    skillsLoaded: skills.map((s) => s.name),
    systemPrompt: parts.join("\n"),
    productMarketingContext,
  };
}
