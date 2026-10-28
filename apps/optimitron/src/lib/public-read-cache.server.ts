import { deserialize, serialize } from "node:v8";
import { unstable_cache, revalidateTag } from "next/cache";

export const PUBLIC_TASK_READ_CACHE_TAG = "public-task-read";
export const PUBLIC_TASK_REPLY_CACHE_TAG = "public-task-reply";
export const PUBLIC_READ_REVALIDATE_SECONDS = 24 * 60 * 60;

/** Cache server-only public read models without converting Dates to strings. */
export function cachePublicRead<Args extends unknown[], Result>(
  read: (...args: Args) => Promise<Result>,
  key: string,
  tags: string[],
  revalidate = PUBLIC_READ_REVALIDATE_SECONDS,
) {
  const cached = unstable_cache(
    async (...args: Args) => serialize(await read(...args)).toString("base64"),
    // V8 serialization is local to a runtime version, unlike the JSON cache envelope.
    [key, process.versions.v8],
    { revalidate, tags },
  );
  return async (...args: Args): Promise<Result> =>
    deserialize(Buffer.from(await cached(...args), "base64")) as Result;
}

export function invalidatePublicTaskReads() {
  invalidatePublicReadTag(PUBLIC_TASK_READ_CACHE_TAG);
}

// Use a separate tag for after-response replies: Next 15 deduplicates tags
// already flushed for the original comment within the same request lifecycle.
export function invalidatePublicTaskReplies() {
  invalidatePublicReadTag(PUBLIC_TASK_REPLY_CACHE_TAG);
}

function invalidatePublicReadTag(tag: string) {
  try {
    revalidateTag(tag);
  } catch (error) {
    // These helpers also run in CLI maintenance scripts without a Next request.
    // Those scripts must invalidate the deployed cache separately after writes.
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    )
      return;
    throw error;
  }
}
