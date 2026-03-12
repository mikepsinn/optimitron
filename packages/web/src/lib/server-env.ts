import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

declare global {
  // eslint-disable-next-line no-var
  var __optomitronServerEnvLoaded: boolean | undefined;
}

if (typeof window === "undefined" && !globalThis.__optomitronServerEnvLoaded) {
  loadEnv({ path: resolve(process.cwd(), "../../.env") });
  loadEnv({ path: resolve(process.cwd(), ".env"), override: true });
  globalThis.__optomitronServerEnvLoaded = true;
}

export {};
