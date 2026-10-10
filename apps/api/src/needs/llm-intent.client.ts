import { Injectable, Logger } from '@nestjs/common';
import type { Intent } from '@needit/shared';
import type { LlmIntentClient } from '@needit/engine';

const SYSTEM_PROMPT = `You extract structured intent from a Nigerian marketplace need.
Return STRICT JSON matching this shape:
{
  "need": string,
  "resultType": "person"|"product"|"service"|"multiple",
  "categoryTag": string,
  "condition": "new"|"used"|"any"|null,
  "budget": {"amount": number_minor_units, "currency": "NGN", "operator": "<="|">="|"~"}|null,
  "location": {"text": string}|null,
  "timing": {"date": string|null, "time": string|null, "flexibility": "flexible"|"fixed"}|null,
  "audience": {"type": string, "detail": string|null}|null,
  "subject": string|null,
  "attributes": Record<string,string>,
  "extras": string[],
  "confidence": number
}
Amounts are in kobo (₦1 = 100 kobo). Understand "150k" = 15,000,000 kobo.`;

/**
 * OpenAI-compatible intent extractor. Enabled only when LLM_ENABLED=true and an
 * API key is present; otherwise the engine falls back to the rule parser.
 */
@Injectable()
export class OpenAiIntentClient implements LlmIntentClient {
  private readonly logger = new Logger(OpenAiIntentClient.name);
  private readonly enabled: boolean;
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    this.enabled = process.env.LLM_ENABLED === 'true';
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.LLM_MODEL ?? 'gpt-4o-mini';
    this.baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  }

  get isEnabled(): boolean {
    return this.enabled && Boolean(this.apiKey);
  }

  async extract(raw: string): Promise<Partial<Intent> | null> {
    if (!this.isEnabled) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: raw },
          ],
        }),
      });
      if (!res.ok) {
        this.logger.warn(`LLM parse failed with status ${res.status}`);
        return null;
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;
      return JSON.parse(content) as Partial<Intent>;
    } catch (err) {
      this.logger.warn(`LLM parse error: ${(err as Error).message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
