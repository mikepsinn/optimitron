import { config } from "dotenv"
import { join } from "path"

/**
 * Load test environment variables
 * This ensures .env.test is loaded with override=true to replace production vars
 * Call this at the top of any test file or utility that needs test env vars
 */
export function loadTestEnv(): void {
  config({ path: join(process.cwd(), ".env.test"), override: false })
}

// Auto-load on import to ensure test env is always available
loadTestEnv()
