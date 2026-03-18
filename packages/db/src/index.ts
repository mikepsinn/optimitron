/**
 * @optimitron/db
 *
 * Database client, Prisma types, and Zod validators for Optimitron
 */

export * from './generated/prisma/client.js';

// Zod validators for all models and enums
export * as schemas from './zod/index.js';


// Shared database-adjacent types (re-exports from Prisma + custom interfaces)
export * from './types.js';

// FillingType case conversion utilities
export {
  fillingTypeToPrisma,
  fillingTypeFromPrisma,
  type OptimizerFillingType,
  type PrismaFillingType,
} from './filling-type.js';
