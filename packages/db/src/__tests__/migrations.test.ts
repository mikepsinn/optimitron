import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(currentDir, "../../prisma/migrations");

describe("Prisma migration assets", () => {
  it("commits Prisma migrations to the repository", () => {
    expect(existsSync(migrationsDir)).toBe(true);

    const entries = readdirSync(migrationsDir);
    const migrationDirs = entries.filter((entry) => {
      const fullPath = resolve(migrationsDir, entry);
      return statSync(fullPath).isDirectory();
    });

    expect(entries).toContain("migration_lock.toml");
    expect(migrationDirs.length).toBeGreaterThan(0);

    for (const migrationDir of migrationDirs) {
      expect(existsSync(resolve(migrationsDir, migrationDir, "migration.sql"))).toBe(
        true,
      );
    }
  });
});
