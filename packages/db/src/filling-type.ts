/**
 * FillingType Case Conversion
 *
 * The optimizer uses lowercase FillingType values ('zero', 'value', 'none', 'interpolation')
 * while Prisma uses uppercase enum values (ZERO, VALUE, NONE, INTERPOLATION).
 *
 * These utilities convert between the two representations.
 */

/** Optimizer-side lowercase filling types */
export type OptimizerFillingType = 'zero' | 'value' | 'none' | 'interpolation';

/** Prisma-side uppercase filling types (mirrors the Prisma enum) */
export type PrismaFillingType = 'ZERO' | 'VALUE' | 'NONE' | 'INTERPOLATION';

const OPTIMIZER_TO_PRISMA: Record<OptimizerFillingType, PrismaFillingType> = {
  zero: 'ZERO',
  value: 'VALUE',
  none: 'NONE',
  interpolation: 'INTERPOLATION',
};

const PRISMA_TO_OPTIMIZER: Record<PrismaFillingType, OptimizerFillingType> = {
  ZERO: 'zero',
  VALUE: 'value',
  NONE: 'none',
  INTERPOLATION: 'interpolation',
};

/**
 * Convert an optimizer-side lowercase FillingType to the Prisma uppercase enum value.
 *
 * @throws {Error} if the input is not a valid optimizer filling type
 */
export function fillingTypeToPrisma(optimizerType: string): PrismaFillingType {
  if (!(optimizerType in OPTIMIZER_TO_PRISMA)) {
    throw new Error(
      `Unknown optimizer FillingType: "${optimizerType}". ` +
      `Expected one of: ${Object.keys(OPTIMIZER_TO_PRISMA).join(', ')}`,
    );
  }
  return OPTIMIZER_TO_PRISMA[optimizerType as OptimizerFillingType];
}

/**
 * Convert a Prisma uppercase FillingType enum value to the optimizer lowercase string.
 *
 * @throws {Error} if the input is not a valid Prisma filling type
 */
export function fillingTypeFromPrisma(prismaType: string): OptimizerFillingType {
  if (!(prismaType in PRISMA_TO_OPTIMIZER)) {
    throw new Error(
      `Unknown Prisma FillingType: "${prismaType}". ` +
      `Expected one of: ${Object.keys(PRISMA_TO_OPTIMIZER).join(', ')}`,
    );
  }
  return PRISMA_TO_OPTIMIZER[prismaType as PrismaFillingType];
}
