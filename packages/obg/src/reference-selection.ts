/** Select the cheapest observations meeting every explicit outcome target.
 * Callers own their cohort, target calculation, and presentation/rounding.
 */
export function selectLowestCostReferences<T>(
  candidates: readonly T[],
  targets: Record<string, number | null>,
  values: (candidate: T) => { cost: number; outcomes: Record<string, number | undefined> },
  compareTies: (left: T, right: T) => number = () => 0,
): T[] {
  const metrics = Object.keys(targets);
  if (!metrics.length) throw new Error('At least one outcome target is required.');
  return candidates.filter(candidate => {
    const { cost, outcomes } = values(candidate);
    return Number.isFinite(cost) && cost >= 0 && metrics.every(metric => {
      const target = targets[metric];
      const outcome = outcomes[metric];
      return target != null && Number.isFinite(target) && outcome !== undefined &&
        Number.isFinite(outcome) && outcome >= target;
    });
  }).sort((left, right) => values(left).cost - values(right).cost || compareTies(left, right));
}
