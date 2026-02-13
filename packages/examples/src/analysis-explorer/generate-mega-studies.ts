import { generateMegaStudyArtifacts } from "./mega-study-generator.js";

async function main(): Promise<void> {
  const artifacts = await generateMegaStudyArtifacts({
    writeFiles: true,
    logProgress: true,
  });

  console.log("\n--- Mega Study Generation Summary ---");
  console.log(`Pair studies generated: ${artifacts.pairStudyCount}`);
  console.log(`Pair studies skipped: ${artifacts.skippedPairCount}`);
  console.log(`Outcome mega studies generated: ${artifacts.outcomeRankingCount}`);
  console.log(`Output directory: ${artifacts.outputDir}`);
}

main().catch((error) => {
  console.error("Failed to generate mega studies:", error);
  process.exitCode = 1;
});
