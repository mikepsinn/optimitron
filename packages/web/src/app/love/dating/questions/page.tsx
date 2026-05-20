import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DatingQuestionsClient } from "@/app/love/dating/dating-client";
import { authOptions } from "@/lib/auth";
import { getDatingQuestionsData } from "@/lib/dating.server";
import { getSignInPath } from "@/lib/routes";

async function loadQuestions(userId: string) {
  try {
    return {
      data: await getDatingQuestionsData(userId),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Could not load questions.",
    };
  }
}

export default async function DatingQuestionsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/love/dating/questions"));
  }

  const { data, error } = await loadQuestions(userId);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href="/love/dating"
        >
          Back to dating
        </Link>
        <h1 className="mt-8 text-4xl font-black uppercase leading-none sm:text-5xl">
          Match questions
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-muted-foreground">
          Answer what you believe and what you can tolerate. Romance is easier
          when the dealbreakers are not discovered during dessert.
        </p>

        <div className="mt-8">
          {error ? (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">Profile needed</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                {error}
              </p>
              <Link
                className="mt-4 inline-flex border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background"
                href="/love/dating/profile"
              >
                Create profile
              </Link>
            </div>
          ) : data?.questions.length ? (
            <DatingQuestionsClient questions={data.questions} />
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">
                No questions yet
              </h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Sync the dating question bank before matching people on answers.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
