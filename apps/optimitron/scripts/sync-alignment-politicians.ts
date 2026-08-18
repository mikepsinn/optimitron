import "./load-env";
import { syncAlignmentBenchmarkPoliticians } from "../src/lib/alignment-politicians.server";

async function main() {
  const result = await syncAlignmentBenchmarkPoliticians();

  if (result.skipped) {
    console.error(result.reason ?? "Alignment politician sync skipped.");
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("Alignment politician sync failed:", error);
  process.exit(1);
});
