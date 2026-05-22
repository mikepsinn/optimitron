import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DatingQuestionsClient } from "@/app/missions/dating-client";
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
      error:
        error instanceof Error ? error.message : "Could not load questions.",
    };
  }
}

function getDisplayError(message: string) {
  return message === "Create a mission profile first."
    ? "Create a mission profile first."
    : message;
}

export default async function DatingQuestionsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/missions/questions"));
  }

  const { data, error } = await loadQuestions(userId);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href="/missions"
        >
          Back to missions
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
                {getDisplayError(error)}
              </p>
              <Link
                className="mt-4 inline-flex border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background"
                href="/missions/profile"
              >
                Create profile
              </Link>
            </div>
          ) : data?.questions.length ? (
            <DatingQuestionsClient questions={data.questions} />
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">No questions yet</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Sync the mission question bank before matching
                people on answers.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
