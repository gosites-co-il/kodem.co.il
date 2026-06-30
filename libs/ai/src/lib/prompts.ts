export const PROMPT_TEMPLATES = {
  discovery: `Analyze the business at {{websiteUrl}} named "{{businessName}}".
Return structured JSON with industry, services, and hypotheses.`,

  insight: `Given business profile: {{profile}}
Generate 3-5 insights explaining what is happening and why it matters.`,

  recommendation: `Given insights: {{insights}}
Suggest the single best next action with expected impact.`,
} as const;

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template,
  );
}
