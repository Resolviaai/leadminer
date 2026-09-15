import { describe, it, expect } from 'vitest';
import { normalizeKeyword } from '../../src/scripts/seed-keywords';

describe('Keyword Normalization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(normalizeKeyword('  joe rogan clips  ')).toBe('joe rogan clips');
  });

  it('should convert uppercase to lowercase', () => {
    expect(normalizeKeyword('Lex Fridman HIGHLIGHTS')).toBe('lex fridman highlights');
  });

  it('should collapse multiple spaces and tabs into a single space', () => {
    expect(normalizeKeyword('mrbeast    viral \t shorts')).toBe('mrbeast viral shorts');
  });

  it('should handle already clean keywords', () => {
    expect(normalizeKeyword('anime best moments')).toBe('anime best moments');
  });
});
