import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidHash, isValidAnswers, cleanText, escapeHtml } from './validate.js';

describe('isValidEmail', () => {
  it('accepts normal emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('user.name+tag@sub.domain.ru')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('no-at-sign')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@c.d')).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail('a@' + 'b'.repeat(260) + '.com')).toBe(false);
  });
});

describe('isValidHash', () => {
  it('accepts UUIDs and legacy base36 hashes', () => {
    expect(isValidHash('3f2c9a1e-7b4d-4e8a-9c1f-2d5b6a7c8d9e')).toBe(true);
    expect(isValidHash('abc12345xyz')).toBe(true);
  });
  it('rejects short, long, or dirty values', () => {
    expect(isValidHash('short')).toBe(false);
    expect(isValidHash('a'.repeat(65))).toBe(false);
    expect(isValidHash('has space here')).toBe(false);
    expect(isValidHash(null)).toBe(false);
  });
});

describe('isValidAnswers', () => {
  it('accepts exactly 12 booleans', () => {
    expect(isValidAnswers(Array(12).fill(true))).toBe(true);
  });
  it('rejects wrong length or non-boolean items', () => {
    expect(isValidAnswers(Array(11).fill(true))).toBe(false);
    expect(isValidAnswers(Array(13).fill(false))).toBe(false);
    expect(isValidAnswers([...Array(11).fill(true), 'yes'])).toBe(false);
    expect(isValidAnswers('not array')).toBe(false);
  });
});

describe('cleanText', () => {
  it('trims and returns valid strings', () => {
    expect(cleanText('  ACME Inc  ', 100)).toBe('ACME Inc');
  });
  it('returns null for empty, too long, or non-string', () => {
    expect(cleanText('   ', 100)).toBe(null);
    expect(cleanText('x'.repeat(101), 100)).toBe(null);
    expect(cleanText(5, 100)).toBe(null);
  });
});

describe('escapeHtml', () => {
  it('escapes html-significant chars', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;'
    );
  });
});
