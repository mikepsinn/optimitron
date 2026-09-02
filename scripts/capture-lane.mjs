/**
 * Walk a lane's routes, rebuilding the lane when its browser wears out.
 *
 * A browser accumulates something as pages are captured until a
 * `page.evaluate` stops returning. `evaluate` has no timeout, so the capture
 * hangs rather than failing, and the browser is unusable from then on. Nothing
 * here can prevent that, so recover from it: discard the lane, open a fresh
 * one, and retry the route that wedged.
 *
 * Only failures `isRecoverable` accepts are retried — an ordinary capture
 * failure, such as a route returning the wrong status, must reach the caller
 * on its first attempt rather than being retried three more times. Recycles
 * are capped so a route that wedges every lane ends the run instead of
 * rebuilding forever.
 *
 * @template TLane
 * @template TRoute
 * @param {object} options
 * @param {TRoute[]} options.routes Routes to capture, in order.
 * @param {() => Promise<TLane & { close: () => Promise<void> }>} options.openLane
 * @param {(route: TRoute, lane: TLane) => Promise<void>} options.captureRoute
 * @param {(error: unknown) => boolean} options.isRecoverable
 * @param {number} options.maxRecycles
 * @param {(route: TRoute, recycles: number) => void} [options.onRecycle]
 */
export async function runCaptureLane({
  routes,
  openLane,
  captureRoute,
  isRecoverable,
  maxRecycles,
  onRecycle,
}) {
  let lane = await openLane();
  let recycles = 0;

  try {
    for (let index = 0; index < routes.length; index += 1) {
      const route = routes[index];
      try {
        await captureRoute(route, lane);
      } catch (error) {
        if (!isRecoverable(error) || recycles >= maxRecycles) {
          throw error;
        }
        recycles += 1;
        onRecycle?.(route, recycles);
        await lane.close();
        lane = await openLane();
        // Retry the route that wedged rather than skipping it.
        index -= 1;
      }
    }
  } finally {
    await lane.close();
  }
}
