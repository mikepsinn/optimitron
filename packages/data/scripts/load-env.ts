import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

config({ path: resolve(__dirname, "../../../.env") });
config({ path: resolve(__dirname, "../.env"), override: true });
