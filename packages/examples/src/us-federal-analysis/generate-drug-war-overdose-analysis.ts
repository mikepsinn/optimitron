import {
  runDrugWarOverdoseStudy,
  writeDrugWarOverdoseStudyFiles,
} from "./drug-war-overdose-study.js";

function main(): void {
  const study = runDrugWarOverdoseStudy();
  const paths = writeDrugWarOverdoseStudyFiles(study);
  console.log("Generated drug war overdose study:");
  console.log(`- Markdown: ${paths.markdownPath}`);
  console.log(`- JSON: ${paths.jsonPath}`);
}

main();
