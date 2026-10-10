import { describe, expect, it } from 'vitest';
import type { Intent } from '@needit/shared';
import { parseIntent, parseIntentRule, type LlmIntentClient } from '../src/index';

describe('parseIntent', () => {
  it('falls back to the rule engine when no client is provided', async () => {
    const intent = await parseIntent('I need a plumber tomorrow');
    expect(intent.resultType).toBe('person');
    expect(intent.need).toBe('I need a plumber tomorrow');
  });

  it('merges LLM output over the rule result', async () => {
    const client: LlmIntentClient = {
      extract: async () => ({
        resultType: 'multiple',
        categoryTag: 'events',
        confidence: 0.92,
      }),
    };
    const intent = await parseIntent('I need a birthday cake', client);
    expect(intent.resultType).toBe('multiple');
    expect(intent.categoryTag).toBe('events');
    expect(intent.confidence).toBe(0.92);
  });

  it('falls back when the LLM client throws', async () => {
    const client: LlmIntentClient = {
      extract: async () => {
        throw new Error('network down');
      },
    };
    const intent = await parseIntent('I need a plumber', client);
    expect(intent.resultType).toBe('person');
  });

  it('falls back when the LLM returns null', async () => {
    const client: LlmIntentClient = { extract: async () => null };
    const intent = await parseIntent('I need a tutor', client);
    expect(intent.resultType).toBe('person');
  });

  it('preserves the rule normalized text over LLM output', async () => {
    const client: LlmIntentClient = {
      extract: async () => ({ normalizedText: 'junk' } as Partial<Intent>),
    };
    const intent = await parseIntent('  I need   a fridge ', client);
    expect(intent.normalizedText).toBe('i need a fridge');
  });
});
