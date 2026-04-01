import { AppError } from '../middleware/errorHandler.js';

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'http://saas-n8n-1:5678/webhook';

/**
 * Call an n8n webhook workflow. n8n holds all AI credentials.
 * Auth-api never talks to Gemini directly.
 */
export async function callN8nWorkflow(
  webhookPath: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const url = `${N8N_BASE_URL}/${webhookPath}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new AppError(`n8n workflow error (${response.status}): ${text}`, 502);
    }
    return await response.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Failed to reach n8n workflow: ${(err as Error).message}`, 502);
  }
}

export function parseJsonResponse(raw: string): unknown {
  let cleaned = raw.trim();
  const match = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (match) cleaned = match[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AppError('Failed to parse AI response as JSON', 502);
  }
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  const missing = rendered.match(/\{\{(\w+)\}\}/g);
  if (missing) {
    throw new AppError(`Missing template variables: ${missing.join(', ')}`, 400);
  }
  return rendered;
}
