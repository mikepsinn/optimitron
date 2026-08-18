import { shareableSnippets } from "@optimitron/data/parameters";

const why = shareableSnippets.whyOptimizationIsNecessary.markdown
  .split(/\n\n+/)
  .map((s) => s.trim())
  .filter(Boolean);

const decl = shareableSnippets.declarationOfOptimization.markdown
  .split(/\n\n+/)
  .map((s) => s.trim())
  .filter(Boolean);

console.log("=== why-2 ===\n" + why[2]);
console.log("\n=== why-3 ===\n" + why[3]);
console.log("\n=== why-7 ===\n" + why[7]);
console.log("\n=== decl-19 ===\n" + decl[19]);
