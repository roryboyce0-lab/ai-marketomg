/**
 * Lightweight deterministic pass inspired by copy-editing “quick checks”:
 * trim fluff, avoid stacked AI-tell patterns, keep operational tone.
 * Full Seven Sweeps stay in the loaded skill prompt for future LLM use.
 */
export function polishDraftMarkdown(markdown: string): string {
  return markdown
    .replace(/\bIt's not just ([^,]+), it's ([^.]+)\./gi, "$2.")
    .replace(/\bIn today's fast-paced world,?\s*/gi, "")
    .replace(/\bLeverage\b/g, "Use")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bsynergy\b/gi, "fit")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Short email wrapper per emails skill principles (subject holds up alone; body extends it). */
export function wrapEmailBody(input: {
  subject: string;
  bodyMarkdown: string;
  fromName: string;
  audienceLabel: string;
}): { subject: string; bodyMarkdown: string } {
  const subject = input.subject.replace(/^Re:\s*/i, "").trim();
  const preview = [
    `${input.fromName} — for ${input.audienceLabel}`,
    "",
    input.bodyMarkdown.trim(),
    "",
    "---",
    "This message is staged for human approval before any send.",
  ].join("\n");

  return { subject, bodyMarkdown: preview };
}
