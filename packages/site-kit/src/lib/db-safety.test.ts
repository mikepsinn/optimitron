import { describe, expect, it } from "vitest"
import {
  assertLocalDatabase,
  isLocalDatabaseUrl,
  ProductionDatabaseAccessError,
} from "./db-safety"

describe("assertLocalDatabase", () => {
  describe("accepts local URLs", () => {
    it("allows localhost", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@localhost:5432/db")
      ).not.toThrow()
    })

    it("allows 127.0.0.1", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@127.0.0.1:5432/db")
      ).not.toThrow()
    })

    it("allows localhost on non-default ports (test DB)", () => {
      expect(() =>
        assertLocalDatabase("postgresql://test_user:pw@localhost:15432/test_db?schema=public")
      ).not.toThrow()
    })
  })

  describe("rejects Neon production URLs", () => {
    it("rejects *.neon.tech", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@ep-cool-name.us-east-1.aws.neon.tech/db?sslmode=require")
      ).toThrow(ProductionDatabaseAccessError)
    })

    it("rejects neondb-named databases", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@somehost/neondb?sslmode=require")
      ).toThrow(ProductionDatabaseAccessError)
    })

    it("rejects generic .neon. substrings", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@ep-xyz.neon.internal/db")
      ).toThrow(ProductionDatabaseAccessError)
    })
  })

  describe("rejects remote-SSL URLs even without Neon branding", () => {
    it("rejects sslmode=require on a non-localhost host", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@prod.example.com/db?sslmode=require")
      ).toThrow(ProductionDatabaseAccessError)
    })
  })

  describe("rejects anything without localhost", () => {
    it("rejects bare hostnames", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@somehost/db")
      ).toThrow(ProductionDatabaseAccessError)
    })

    it("rejects IPv4 addresses that aren't 127.0.0.1", () => {
      expect(() =>
        assertLocalDatabase("postgresql://user:pass@10.0.0.5/db")
      ).toThrow(ProductionDatabaseAccessError)
    })
  })

  describe("handles bad input", () => {
    it("rejects undefined", () => {
      expect(() => assertLocalDatabase(undefined)).toThrow(ProductionDatabaseAccessError)
    })

    it("rejects null", () => {
      expect(() => assertLocalDatabase(null)).toThrow(ProductionDatabaseAccessError)
    })

    it("rejects empty string", () => {
      expect(() => assertLocalDatabase("")).toThrow(ProductionDatabaseAccessError)
    })
  })

  it("includes the operation name in the error message", () => {
    try {
      assertLocalDatabase("postgresql://user:pass@prod.neon.tech/db", {
        operation: "Migration reset",
      })
      throw new Error("expected to throw")
    } catch (err) {
      expect(err).toBeInstanceOf(ProductionDatabaseAccessError)
      expect((err as Error).message).toContain("Migration reset")
    }
  })
})

describe("isLocalDatabaseUrl", () => {
  it("returns true for localhost", () => {
    expect(isLocalDatabaseUrl("postgresql://user:pass@localhost:5432/db")).toBe(true)
  })

  it("returns false for Neon URLs", () => {
    expect(isLocalDatabaseUrl("postgresql://user:pass@ep.neon.tech/db")).toBe(false)
  })

  it("returns false for undefined / null / empty", () => {
    expect(isLocalDatabaseUrl(undefined)).toBe(false)
    expect(isLocalDatabaseUrl(null)).toBe(false)
    expect(isLocalDatabaseUrl("")).toBe(false)
  })
})
