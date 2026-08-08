import "@testing-library/jest-dom"
import { beforeAll, afterEach, afterAll } from "vitest"
import { cleanup } from "@testing-library/react"
import "./utils/test-env" // Load test environment variables
import { cleanDatabase, disconnectDatabase, setupTestDatabase } from "./utils/db-test-utils"

let dbAvailable = false
const shouldSetupDatabase = process.env.SKIP_DB_TEST_SETUP !== "1"

// Setup test database before all tests (skip gracefully if DB unavailable for unit tests)
beforeAll(async () => {
  if (!shouldSetupDatabase) {
    return
  }
  try {
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
  if (dbAvailable) {
    await cleanDatabase()
  }
})

// Disconnect from database after all tests
afterAll(async () => {
  if (dbAvailable) {
    await disconnectDatabase()
  }
})
