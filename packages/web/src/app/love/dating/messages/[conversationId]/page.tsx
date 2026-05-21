import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import {
  DatingDatePlanForm,
  DatingMessageComposer,
  DatingReportButton,
} from "@/app/love/dating/dating-client";
import { authOptions } from "@/lib/auth";
import { getDatingConversationData } from "@/lib/dating.server";
import { getSignInPath } from "@/lib/routes";

interface DatingMessagePageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function DatingMessagePage({
  params,
}: DatingMessagePageProps) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect(getSignInPath("/love/dating/matches"));
  }

  const { conversationId } = await params;
  const { conversation, profile } = await getDatingConversationData(
    userId,
    conversationId,
  );

  if (!conversation) {
    notFound();
  }

  const other =
    conversation.match.profileAId === profile.id
      ? conversation.match.profileB
      : conversation.match.profileA;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] max-sm:pr-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href="/love/dating/matches"
        >
          Back to matches
        </Link>
        <div className="mt-8 flex flex-col gap-4 border-b-2 border-foreground pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
              {other.user.person?.displayName ?? other.user.email}
            </h1>
            {other.headline ? (
              <p className="mt-2 text-lg font-bold text-muted-foreground">
                {other.headline}
              </p>
            ) : null}
          </div>
          <DatingReportButton reportedProfileId={other.id} />
        </div>

        <div className="mt-8 grid gap-4">
          {conversation.messages.length ? (
            conversation.messages.map((message) => {
              const mine = message.senderProfileId === profile.id;

              return (
                <div
                  className={`border-2 border-foreground p-4 ${
                    mine
                      ? "ml-auto max-w-[80%] bg-foreground text-background"
                      : "mr-auto max-w-[80%]"
                  }`}
                  key={message.id}
                >
                  <p className="text-sm font-bold leading-relaxed">
                    {message.body}
                  </p>
                  {!mine ? (
                    <div className="mt-3">
                      <DatingReportButton
                        messageId={message.id}
                        reportedProfileId={other.id}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="border-2 border-foreground p-5">
              <h2 className="text-lg font-black uppercase">No messages yet</h2>
              <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                Say something normal. Then maybe propose coffee and flyers.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_320px]">
          <DatingMessageComposer conversationId={conversation.id} />
          <DatingDatePlanForm
            conversationId={conversation.id}
            matchId={conversation.matchId}
          />
        </div>

        {conversation.datePlans.length ? (
          <div className="mt-8 border-2 border-foreground p-5">
            <h2 className="text-lg font-black uppercase">
              Earth Optimization Date plans
            </h2>
            <div className="mt-3 grid gap-3">
              {conversation.datePlans.map((plan) => (
                <div className="border-t border-foreground pt-3" key={plan.id}>
                  <p className="font-black uppercase">{plan.title}</p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {plan.locationName ?? "Place not set"}
                    {plan.isCampaignDate ? " · Earth Optimization Date" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
