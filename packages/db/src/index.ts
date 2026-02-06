/**
 * @optomitron/db
 *
 * Database client, Prisma types, and Zod validators for Optomitron
 */

export { PrismaClient } from '@prisma/client';
export type * from '@prisma/client';

// Zod validators for all models and enums
export * as schemas from './zod/index.js';


// FillingType case conversion utilities
export {
  fillingTypeToPrisma,
  fillingTypeFromPrisma,
  type OptimizerFillingType,
  type PrismaFillingType,
} from './filling-type.js';
