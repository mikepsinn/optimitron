import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TaskPayoutStatus } from "@optimitron/db";
import type { Prisma } from "@optimitron/db";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTaskPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

function formatUsdCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(cents / 100);
}

function formatDate(value: Date | null) {
  if (!value) return "Not scheduled";
  return value.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type PayoutRow = Prisma.TaskPayoutGetPayload<{
  include: {
    payeeUser: {
      select: {
        email: true;
        person: {
          select: {
            displayName: true;
          };
        };
      };
    };
    stripeConnectedAccount: {
      select: {
        status: true;
        transfersCapabilityStatus: true;
      };
    };
    task: {
      select: {
        id: true;
        title: true;
      };
    };
  };
}>;

function PayoutStatusBlock({ payout }: { payout: PayoutRow }) {
  return (
    <>
      <span className="block font-black">{payout.status}</span>
      <span className="block text-xs text-muted-foreground">
        {payout.stripeConnectedAccount
          ? `${payout.stripeConnectedAccount.status} / ${payout.stripeConnectedAccount.transfersCapabilityStatus}`
          : "No connected account"}
      </span>
    </>
  );
}

function PayeeName({ payout }: { payout: PayoutRow }) {
  return (
    <>
      {payout.payeeUser.person?.displayName ??
        payout.payeeUser.email ??
        payout.payeeUserId}
    </>
  );
}

export default async function AdminTaskPayoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/admin/task-payouts");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    redirect("/");
  }

  const payouts = await prisma.taskPayout.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [
          TaskPayoutStatus.PENDING_CONNECT,
          TaskPayoutStatus.PENDING_FUNDS,
          TaskPayoutStatus.FAILED,
          TaskPayoutStatus.READY,
          TaskPayoutStatus.PROCESSING,
        ],
      },
    },
    include: {
      payeeUser: {
        select: {
          email: true,
          person: {
            select: {
              displayName: true,
            },
          },
        },
      },
      stripeConnectedAccount: {
        select: {
          status: true,
          transfersCapabilityStatus: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: 100,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-foreground pb-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
            Task payouts
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-bold text-muted-foreground">
            Waiting payouts retry automatically. Failed rows stay visible until
            the Connect, funding, or Stripe error is fixed.
          </p>
        </div>

        <section className="py-6">
          {payouts.length > 0 ? (
            <>
              <div className="space-y-4 sm:hidden">
                {payouts.map((payout) => (
                  <article className="border border-foreground p-4" key={payout.id}>
                    <Link
                      className="font-black underline underline-offset-4"
                      href={getTaskPath(payout.task.id)}
                    >
                      {payout.task.title}
                    </Link>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-bold">
                      <div>
                        <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          Worker
                        </dt>
                        <dd className="mt-1">
                          <PayeeName payout={payout} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          Amount
                        </dt>
                        <dd className="mt-1">
                          {formatUsdCents(payout.amountCents)}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          State
                        </dt>
                        <dd className="mt-1">
                          <PayoutStatusBlock payout={payout} />
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          Next retry
                        </dt>
                        <dd className="mt-1">{formatDate(payout.nextAttemptAt)}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          Last error
                        </dt>
                        <dd className="mt-1 text-muted-foreground">
                          {payout.lastError ?? "None"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <div className="hidden sm:block">
                <table className="w-full border-collapse text-left text-sm font-bold">
                <thead>
                  <tr className="border-b border-foreground text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="py-3 pr-4">Task</th>
                    <th className="py-3 pr-4">Worker</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">State</th>
                    <th className="py-3 pr-4">Next retry</th>
                    <th className="py-3 pr-4">Last error</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr className="border-b border-foreground" key={payout.id}>
                      <td className="py-4 pr-4 align-top">
                        <Link
                          className="font-black underline underline-offset-4"
                          href={getTaskPath(payout.task.id)}
                        >
                          {payout.task.title}
                        </Link>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <PayeeName payout={payout} />
                      </td>
                      <td className="py-4 pr-4 align-top">
                        {formatUsdCents(payout.amountCents)}
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <PayoutStatusBlock payout={payout} />
                      </td>
                      <td className="py-4 pr-4 align-top">
                        {formatDate(payout.nextAttemptAt)}
                      </td>
                      <td className="max-w-xs py-4 pr-4 align-top text-muted-foreground">
                        {payout.lastError ?? "None"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <div className="border border-foreground p-6">
              <h2 className="text-xl font-black">No stuck payouts</h2>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                Nothing needs payment attention right now.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
