import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));

config({ path: resolve(scriptDir, "../../../.env") });
config({ path: resolve(scriptDir, "../.env"), override: true });
