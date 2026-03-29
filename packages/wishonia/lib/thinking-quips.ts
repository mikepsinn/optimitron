/**
 * Rotating quips shown while Wishonia is thinking.
 * Educational facts + personality jokes from the transmit version.
 */

export const THINKING_QUIPS = [
  "The 1% Treaty would redirect $27.2 billion per year to clinical trials...",
  "Your RECOVERY trial proved you can test treatments for $500 per patient...",
  "150,000 humans die every day from diseases. That's 2 per second...",
  "Global military spending: $2.72 trillion per year. On killing capacity...",
  "The FDA makes treatments wait 8.2 years AFTER they've been proven safe...",
  "Singapore spends 25% of what America spends on healthcare...",
  "If cancer had oil reserves, you would have cured it by 2003...",
  "Your Department of Defense mainly just attacks people...",
  "Risk of dying from terrorism: 1 in 30 million. From disease: 100%...",
  "Wishocracy lets 8 billion people allocate the budget. No committees...",
  "Incentive Alignment Bonds: the greedier investors are, the faster diseases get cured...",
  "You named your planet dirt...",
  "Communism collapsed in a single human lifetime. Without the internet...",
  "I ended war on my planet in year 12. Disease took until year 340...",
  "Your species spends 604x more on weapons than testing which medicines work...",
];

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Returns a shuffled copy of quips for display rotation */
export function getShuffledQuips(): string[] {
  return shuffle(THINKING_QUIPS);
}
