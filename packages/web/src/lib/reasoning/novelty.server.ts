/**
 * Semantic-distance novelty scoring for new variant arms.
 *
 * Computed at arm creation: 1 − cosine_similarity(new_arm_embedding, mean
 * of existing ACTIVE arm embeddings in same slot × family).
 *
 * Production: calls Anthropic/OpenAI embedding endpoint. For v1 we stub
 * with a lightweight n-gram-based distance so the pipeline compiles end
 * to end before embedding keys are provisioned.
 */

export type NoveltyInput = {
  candidateText: string;
  exemplarTexts: readonly string[];
};

/**
 * Character-bigram Jaccard similarity — cheap, deterministic, dependency-free.
 * Swap for a real embedding model in production (anthropic.embeddings.create).
 * Returns ∈ [0, 1]; higher = more novel.
 */
export function computeNoveltyScore(input: NoveltyInput): number {
  if (input.exemplarTexts.length === 0) return 1;
  const candidateNgrams = charBigrams(input.candidateText);
  if (candidateNgrams.size === 0) return 0;

  let maxSimilarity = 0;
  for (const exemplar of input.exemplarTexts) {
    const exemplarNgrams = charBigrams(exemplar);
    if (exemplarNgrams.size === 0) continue;
    const intersection = countIntersection(candidateNgrams, exemplarNgrams);
    const union = candidateNgrams.size + exemplarNgrams.size - intersection;
    const jaccard = union === 0 ? 0 : intersection / union;
    if (jaccard > maxSimilarity) maxSimilarity = jaccard;
  }
  return 1 - maxSimilarity;
}

function charBigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const out = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    out.add(normalized.slice(i, i + 2));
  }
  return out;
}

function countIntersection<T>(a: Set<T>, b: Set<T>): number {
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  let n = 0;
  for (const item of smaller) {
    if (larger.has(item)) n++;
  }
  return n;
}
