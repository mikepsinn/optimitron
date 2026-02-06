/**
 * Tests for FillingType case conversion between optimizer and Prisma.
 */
import { describe, it, expect } from 'vitest';
import {
  fillingTypeToPrisma,
  fillingTypeFromPrisma,
} from '../filling-type.js';

describe('fillingTypeToPrisma', () => {
  it('converts "zero" to "ZERO"', () => {
    expect(fillingTypeToPrisma('zero')).toBe('ZERO');
  });

  it('converts "value" to "VALUE"', () => {
    expect(fillingTypeToPrisma('value')).toBe('VALUE');
  });

  it('converts "none" to "NONE"', () => {
    expect(fillingTypeToPrisma('none')).toBe('NONE');
  });

  it('converts "interpolation" to "INTERPOLATION"', () => {
    expect(fillingTypeToPrisma('interpolation')).toBe('INTERPOLATION');
  });

  it('throws for unknown optimizer type', () => {
    expect(() => fillingTypeToPrisma('ZERO')).toThrow('Unknown optimizer FillingType');
    expect(() => fillingTypeToPrisma('unknown')).toThrow('Unknown optimizer FillingType');
  });
});

describe('fillingTypeFromPrisma', () => {
  it('converts "ZERO" to "zero"', () => {
    expect(fillingTypeFromPrisma('ZERO')).toBe('zero');
  });

  it('converts "VALUE" to "value"', () => {
    expect(fillingTypeFromPrisma('VALUE')).toBe('value');
  });

  it('converts "NONE" to "none"', () => {
    expect(fillingTypeFromPrisma('NONE')).toBe('none');
  });

  it('converts "INTERPOLATION" to "interpolation"', () => {
    expect(fillingTypeFromPrisma('INTERPOLATION')).toBe('interpolation');
  });

  it('throws for unknown Prisma type', () => {
    expect(() => fillingTypeFromPrisma('zero')).toThrow('Unknown Prisma FillingType');
    expect(() => fillingTypeFromPrisma('invalid')).toThrow('Unknown Prisma FillingType');
  });
});

describe('round-trip conversion', () => {
  const types = ['zero', 'value', 'none', 'interpolation'] as const;

  for (const t of types) {
    it(`round-trips "${t}" through Prisma and back`, () => {
      const prisma = fillingTypeToPrisma(t);
      const back = fillingTypeFromPrisma(prisma);
      expect(back).toBe(t);
    });
  }
});
