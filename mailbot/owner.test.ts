import { describe, it, expect } from 'vitest';
import { isOwner } from './owner.js';

describe('isOwner', () => {
  const owners = [152579925, 42];

  it('accepts a listed id', () => {
    expect(isOwner(152579925, owners)).toBe(true);
  });

  it('rejects an unlisted id', () => {
    expect(isOwner(999, owners)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isOwner(undefined, owners)).toBe(false);
  });
});
