import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

declare global {
  // eslint-disable-next-line no-var
  var __optimitronServerEnvLoaded: boolean | undefined;
}

if (typeof window === "undefined" && !globalThis.__optimitronServerEnvLoaded) {
  loadEnv({ path: resolve(process.cwd(), "../../.env") });
  loadEnv({ path: resolve(process.cwd(), ".env"), override: true });
  globalThis.__optimitronServerEnvLoaded = true;
}

export {};
