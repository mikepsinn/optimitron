import "@testing-library/jest-dom"
import { beforeAll, afterEach, afterAll } from "vitest"
import { cleanup } from "@testing-library/react"
import "./utils/test-env" // Load test environment variables

let dbAvailable = false
const shouldSetupDatabase = process.env.SKIP_DB_TEST_SETUP !== "1"

// Lazy-import DB helpers so pure unit tests never need site-kit db-safety resolution.
let cleanDatabase: (() => Promise<void>) | undefined
let disconnectDatabase: (() => Promise<void>) | undefined
let setupTestDatabase: (() => Promise<void>) | undefined

// Setup test database before all tests (skip gracefully if DB unavailable for unit tests)
beforeAll(async () => {
  if (!shouldSetupDatabase) {
    return
  }
  try {
    const dbUtils = await import("./utils/db-test-utils")
    cleanDatabase = dbUtils.cleanDatabase
    disconnectDatabase = dbUtils.disconnectDatabase
    setupTestDatabase = dbUtils.setupTestDatabase
    await setupTestDatabase()
    dbAvailable = true
  } catch (error) {
    // Database not available - this is fine for pure unit tests, but log the reason
    // so it's debuggable when someone expected it to work.
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`⚠️  Database not available (${message}). Integration tests will be skipped.`)
    dbAvailable = false
  }
}, 10000) // Increase timeout for database setup

// Cleanup after each test
afterEach(async () => {
  cleanup()
  // Only clean database if it's available
  if (dbAvailable && cleanDatabase) {
    await cleanDatabase()
  }
})

// Disconnect from database after all tests
afterAll(async () => {
  if (dbAvailable && disconnectDatabase) {
    await disconnectDatabase()
  }
})