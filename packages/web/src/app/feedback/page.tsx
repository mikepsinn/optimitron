import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  createFeedbackTask,
  FEEDBACK_HONEYPOT_FIELD,
  isFeedbackRejectedError,
} from "@/lib/feedback.server";
import { getRouteMetadata } from "@/lib/metadata";
import { feedbackLink, ROUTES } from "@/lib/routes";
import { authOptions } from "@/lib/auth";

export const metadata = getRouteMetadata(feedbackLink);
export const dynamic = "force-dynamic";

type FeedbackSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function submitFeedback(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  let redirectPath = "";

  try {
    const result = await createFeedbackTask({
      antiSpam: {
        honeypot: String(formData.get(FEEDBACK_HONEYPOT_FIELD) ?? ""),
      },
      contactEmail: String(formData.get("contactEmail") ?? ""),
      message: String(formData.get("message") ?? ""),
      pageUrl: String(formData.get("pageUrl") ?? ""),
      submitterEmail: session?.user?.email ?? null,
      submitterUserId: session?.user?.id ?? null,
    });
    redirectPath = `${ROUTES.feedback}?sent=1&task=${encodeURIComponent(result.taskId)}`;
  } catch (error) {
    if (!isFeedbackRejectedError(error)) throw error;
    redirectPath = `${ROUTES.feedback}?sent=1`;
  }

  redirect(redirectPath);
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<FeedbackSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const sent = first(params.sent) === "1";
  const pageUrl = first(params.url) ?? "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="mb-8">
        <Link
          className="text-xs font-black uppercase tracking-[0.16em] underline underline-offset-4"
          href={ROUTES.home}
        >
          Back
        </Link>
      </div>

      <header className="border-b-2 border-foreground pb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Feedback
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none text-foreground sm:text-6xl">
          Help coordinate humanity better.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-bold leading-7 text-muted-foreground">
          A decentralized to-do list for humanity. It coordinates the work to
          end war and disease, in the least irritating way possible. Tell us
          where it falls short.
        </p>
      </header>

      {sent ? (
        <section className="mt-8 border-2 border-foreground bg-background p-5">
          <p className="text-xl font-black uppercase text-foreground">
            Feedback sent.
          </p>
          <p className="mt-2 font-bold leading-7 text-muted-foreground">
            It became an internal task for review. Excellent use of the
            complaint apparatus.
          </p>
        </section>
      ) : null}

      {!sent ? (
        <form action={submitFeedback} className="mt-8 space-y-5">
          <div aria-hidden="true" className="absolute -left-[10000px] top-auto">
            <label htmlFor={FEEDBACK_HONEYPOT_FIELD}>Company website</label>
            <input
              autoComplete="off"
              id={FEEDBACK_HONEYPOT_FIELD}
              name={FEEDBACK_HONEYPOT_FIELD}
              tabIndex={-1}
              type="text"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-muted-foreground"
              htmlFor="message"
            >
              What should change?
            </label>
            <textarea
              className="min-h-48 w-full border-2 border-foreground bg-background px-4 py-3 font-bold leading-7 text-foreground"
              id="message"
              maxLength={8000}
              minLength={3}
              name="message"
              placeholder="Site improvements, missing tasks, copy complaints, confusing pages, irritating emails, better strategy, all useful."
              required
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-muted-foreground"
              htmlFor="pageUrl"
            >
              Page URL
            </label>
            <input
              className="w-full border-2 border-foreground bg-background px-4 py-3 font-bold text-foreground"
              defaultValue={pageUrl}
              id="pageUrl"
              maxLength={1000}
              name="pageUrl"
              placeholder="https://warondisease.org/..."
              type="url"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-muted-foreground"
              htmlFor="contactEmail"
            >
              Email
            </label>
            <input
              className="w-full border-2 border-foreground bg-background px-4 py-3 font-bold text-foreground"
              id="contactEmail"
              maxLength={254}
              name="contactEmail"
              placeholder="Optional, if you want a reply"
              type="email"
            />
          </div>

          <button
            className="w-full border-2 border-foreground bg-foreground px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-background hover:bg-background hover:text-foreground sm:w-auto"
            type="submit"
          >
            Send.
          </button>
        </form>
      ) : null}
    </main>
  );
}
