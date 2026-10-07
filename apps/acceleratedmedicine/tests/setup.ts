import "@testing-library/jest-dom"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import "./utils/test-env" // Load test environment variables

// Unit tests never touch a database. The integration suite (vitest.integration.config.ts) needs a local test
// database and checks for one before it runs.
afterEach(() => {
  cleanup()
})
