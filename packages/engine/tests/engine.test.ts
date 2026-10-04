import { describe, expect, it } from 'vitest';
import { classifyResultType, isEventNeed, normalizeText } from '../src/index';

describe('engine fallback heuristics', () => {
  it('classifies used washing machine as product', () => {
    expect(classifyResultType('I need a used washing machine under ₦150k')).toBe('product');
  });

  it('classifies plumber as person', () => {
    expect(classifyResultType('I need a plumber tomorrow')).toBe('person');
  });

  it('classifies flyer design as service', () => {
    expect(classifyResultType('I need someone to design a flyer')).toBe('service');
  });

  it('detects event needs', () => {
    expect(isEventNeed('I need a birthday cake tomorrow')).toBe(true);
    expect(isEventNeed('I need a plumber')).toBe(false);
  });

  it('normalizes whitespace and case', () => {
    expect(normalizeText('  I need   a Fridge ')).toBe('i need a fridge');
  });
});