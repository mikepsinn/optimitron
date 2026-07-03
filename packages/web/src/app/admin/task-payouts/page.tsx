import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  TaskFundingPaymentSource,
  TaskFundingPaymentStatus,
  TaskFundingPledgeStatus,
  TaskFundingTargetStatus,
  TaskPayoutStatus,
} from "@optimitron/db";
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

type EscrowPledgeRow = Prisma.TaskFundingPledgeGetPayload<{
  select: {
    id: true;
    status: true;
    committedAmountCents: true;
    cardBrand: true;
    cardLast4: true;
    calledAt: true;
    fulfilledAt: true;
    declinedAt: true;
    publicNameSnapshot: true;
    pledgeActorKey: true;
    pledgedByUser: {
      select: {
        email: true;
        person: { select: { displayName: true } };
      };
    };
    target: {
      select: {
        task: { select: { id: true; title: true } };
      };
    };
  };
}>;

type PledgeCallPaymentRow = Prisma.TaskFundingPaymentGetPayload<{
  select: {
    id: true;
    status: true;
    amountCents: true;
    paidAt: true;
    failedAt: true;
    refundedAt: true;
    createdAt: true;
    donorName: true;
    donorEmail: true;
    donorUser: {
      select: {
        email: true;
        person: { select: { displayName: true } };
      };
    };
    task: { select: { id: true; title: true } };
  };
}>;

type RefundAttentionTargetRow = Prisma.TaskFundingTargetGetPayload<{
  select: {
    id: true;
    status: true;
    expiresAt: true;
    task: { select: { id: true; title: true } };
    payments: { select: { amountCents: true } };
  };
}>;

function getPledgerName(pledge: EscrowPledgeRow) {
  return (
    pledge.pledgedByUser?.person?.displayName ??
    pledge.pledgedByUser?.email ??
    pledge.publicNameSnapshot ??
    pledge.pledgeActorKey
  );
}

function getDonorName(payment: PledgeCallPaymentRow) {
  return (
    payment.donorUser?.person?.displayName ??
    payment.donorName ??
    payment.donorUser?.email ??
    payment.donorEmail ??
    "Anonymous"
  );
}

function getPledgeCardLabel(pledge: EscrowPledgeRow) {
  if (!pledge.cardLast4) return "Card pending";
  return `${pledge.cardBrand ?? "Card"} •••• ${pledge.cardLast4}`;
}

function PledgeStatusBlock({ pledge }: { pledge: EscrowPledgeRow }) {
  const detail =
    pledge.status === TaskFundingPledgeStatus.DECLINED && pledge.declinedAt
      ? `Declined ${formatDate(pledge.declinedAt)}`
      : pledge.status === TaskFundingPledgeStatus.CALLED && pledge.calledAt
        ? `Called ${formatDate(pledge.calledAt)}`
        : pledge.status === TaskFundingPledgeStatus.FULFILLED &&
            pledge.fulfilledAt
          ? `Fulfilled ${formatDate(pledge.fulfilledAt)}`
          : pledge.status === TaskFundingPledgeStatus.ACTIVE
            ? "Saved card, uncharged"
            : null;
  return (
    <>
      <span className="block font-black">{pledge.status}</span>
      {detail ? (
        <span className="block text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </>
  );
}

function PledgeCallStatusBlock({ payment }: { payment: PledgeCallPaymentRow }) {
  const detail =
    payment.status === TaskFundingPaymentStatus.PAID && payment.paidAt
      ? `Paid ${formatDate(payment.paidAt)}`
      : payment.status === TaskFundingPaymentStatus.FAILED && payment.failedAt
        ? `Failed ${formatDate(payment.failedAt)}`
        : payment.status === TaskFundingPaymentStatus.REFUNDED &&
            payment.refundedAt
          ? `Refunded ${formatDate(payment.refundedAt)}`
          : null;
  return (
    <>
      <span className="block font-black">{payment.status}</span>
      {detail ? (
        <span className="block text-xs text-muted-foreground">{detail}</span>
      ) : null}
    </>
  );
}

function TargetStatusBlock({ target }: { target: RefundAttentionTargetRow }) {
  return (
    <>
      <span className="block font-black">{target.status}</span>
      {target.status === TaskFundingTargetStatus.EXPIRED && target.expiresAt ? (
        <span className="block text-xs text-muted-foreground">
          Expired {formatDate(target.expiresAt)}
        </span>
      ) : null}
    </>
  );
}

function getUnrefundedPaidCents(target: RefundAttentionTargetRow) {
  return target.payments.reduce((sum, payment) => sum + payment.amountCents, 0);
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

  const [escrowPledges, pledgeCallPayments, refundAttentionTargets] =
    await Promise.all([
      prisma.taskFundingPledge.findMany({
        where: {
          deletedAt: null,
          stripeSetupIntentId: { not: null },
          status: {
            in: [
              TaskFundingPledgeStatus.ACTIVE,
              TaskFundingPledgeStatus.CALLED,
              TaskFundingPledgeStatus.FULFILLED,
              TaskFundingPledgeStatus.DECLINED,
            ],
          },
        },
        select: {
          id: true,
          status: true,
          committedAmountCents: true,
          cardBrand: true,
          cardLast4: true,
          calledAt: true,
          fulfilledAt: true,
          declinedAt: true,
          publicNameSnapshot: true,
          pledgeActorKey: true,
          pledgedByUser: {
            select: {
              email: true,
              person: { select: { displayName: true } },
            },
          },
          target: {
            select: {
              task: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.taskFundingPayment.findMany({
        where: {
          deletedAt: null,
          source: TaskFundingPaymentSource.PLEDGE_CALL,
        },
        select: {
          id: true,
          status: true,
          amountCents: true,
          paidAt: true,
          failedAt: true,
          refundedAt: true,
          createdAt: true,
          donorName: true,
          donorEmail: true,
          donorUser: {
            select: {
              email: true,
              person: { select: { displayName: true } },
            },
          },
          task: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.taskFundingTarget.findMany({
        where: {
          deletedAt: null,
          status: {
            in: [
              TaskFundingTargetStatus.EXPIRED,
              TaskFundingTargetStatus.CANCELLED,
            ],
          },
          payments: {
            some: {
              deletedAt: null,
              status: TaskFundingPaymentStatus.PAID,
            },
          },
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          task: { select: { id: true, title: true } },
          payments: {
            where: {
              deletedAt: null,
              status: TaskFundingPaymentStatus.PAID,
            },
            select: { amountCents: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

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

        <section className="border-t border-foreground py-6">
          <h2 className="text-2xl font-black leading-tight sm:text-3xl">
            Funding escrow
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-bold text-muted-foreground">
            Card-backed pledges charge automatically when their target fully
            funds. This view is read-only; the charge worker and refund sweep
            do the work.
          </p>

          <div className="mt-6 space-y-10">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                Card-backed pledges
              </h3>
              {escrowPledges.length > 0 ? (
                <>
                  <div className="mt-3 space-y-4 sm:hidden">
                    {escrowPledges.map((pledge) => (
                      <article
                        className="border border-foreground p-4"
                        key={pledge.id}
                      >
                        <Link
                          className="font-black underline underline-offset-4"
                          href={getTaskPath(pledge.target.task.id)}
                        >
                          {pledge.target.task.title}
                        </Link>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-bold">
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Pledger
                            </dt>
                            <dd className="mt-1">{getPledgerName(pledge)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Amount
                            </dt>
                            <dd className="mt-1">
                              {formatUsdCents(
                                Number(pledge.committedAmountCents),
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Card
                            </dt>
                            <dd className="mt-1">
                              {getPledgeCardLabel(pledge)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              State
                            </dt>
                            <dd className="mt-1">
                              <PledgeStatusBlock pledge={pledge} />
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                  <div className="mt-3 hidden sm:block">
                    <table className="w-full border-collapse text-left text-sm font-bold">
                      <thead>
                        <tr className="border-b border-foreground text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          <th className="py-3 pr-4">Task</th>
                          <th className="py-3 pr-4">Pledger</th>
                          <th className="py-3 pr-4">Amount</th>
                          <th className="py-3 pr-4">Card</th>
                          <th className="py-3 pr-4">State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escrowPledges.map((pledge) => (
                          <tr
                            className="border-b border-foreground"
                            key={pledge.id}
                          >
                            <td className="py-4 pr-4 align-top">
                              <Link
                                className="font-black underline underline-offset-4"
                                href={getTaskPath(pledge.target.task.id)}
                              >
                                {pledge.target.task.title}
                              </Link>
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {getPledgerName(pledge)}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {formatUsdCents(
                                Number(pledge.committedAmountCents),
                              )}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {getPledgeCardLabel(pledge)}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              <PledgeStatusBlock pledge={pledge} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 border border-foreground p-4 text-sm font-bold text-muted-foreground">
                  No card-backed pledges yet.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                Pledge-call charges
              </h3>
              {pledgeCallPayments.length > 0 ? (
                <>
                  <div className="mt-3 space-y-4 sm:hidden">
                    {pledgeCallPayments.map((payment) => (
                      <article
                        className="border border-foreground p-4"
                        key={payment.id}
                      >
                        <Link
                          className="font-black underline underline-offset-4"
                          href={getTaskPath(payment.task.id)}
                        >
                          {payment.task.title}
                        </Link>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-bold">
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Donor
                            </dt>
                            <dd className="mt-1">{getDonorName(payment)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Amount
                            </dt>
                            <dd className="mt-1">
                              {formatUsdCents(payment.amountCents)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              State
                            </dt>
                            <dd className="mt-1">
                              <PledgeCallStatusBlock payment={payment} />
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Created
                            </dt>
                            <dd className="mt-1">
                              {formatDate(payment.createdAt)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                  <div className="mt-3 hidden sm:block">
                    <table className="w-full border-collapse text-left text-sm font-bold">
                      <thead>
                        <tr className="border-b border-foreground text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          <th className="py-3 pr-4">Task</th>
                          <th className="py-3 pr-4">Donor</th>
                          <th className="py-3 pr-4">Amount</th>
                          <th className="py-3 pr-4">State</th>
                          <th className="py-3 pr-4">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pledgeCallPayments.map((payment) => (
                          <tr
                            className="border-b border-foreground"
                            key={payment.id}
                          >
                            <td className="py-4 pr-4 align-top">
                              <Link
                                className="font-black underline underline-offset-4"
                                href={getTaskPath(payment.task.id)}
                              >
                                {payment.task.title}
                              </Link>
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {getDonorName(payment)}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {formatUsdCents(payment.amountCents)}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              <PledgeCallStatusBlock payment={payment} />
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {formatDate(payment.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 border border-foreground p-4 text-sm font-bold text-muted-foreground">
                  No pledge-call charges yet.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                Needs refund attention
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-bold text-muted-foreground">
                Expired or cancelled targets still holding paid, unrefunded
                money. The refund sweep should drain this list.
              </p>
              {refundAttentionTargets.length > 0 ? (
                <>
                  <div className="mt-3 space-y-4 sm:hidden">
                    {refundAttentionTargets.map((target) => (
                      <article
                        className="border border-foreground p-4"
                        key={target.id}
                      >
                        <Link
                          className="font-black underline underline-offset-4"
                          href={getTaskPath(target.task.id)}
                        >
                          {target.task.title}
                        </Link>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-bold">
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              State
                            </dt>
                            <dd className="mt-1">
                              <TargetStatusBlock target={target} />
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Unrefunded
                            </dt>
                            <dd className="mt-1">
                              {formatUsdCents(getUnrefundedPaidCents(target))}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                              Paid payments
                            </dt>
                            <dd className="mt-1">{target.payments.length}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                  <div className="mt-3 hidden sm:block">
                    <table className="w-full border-collapse text-left text-sm font-bold">
                      <thead>
                        <tr className="border-b border-foreground text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                          <th className="py-3 pr-4">Task</th>
                          <th className="py-3 pr-4">State</th>
                          <th className="py-3 pr-4">Unrefunded</th>
                          <th className="py-3 pr-4">Paid payments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refundAttentionTargets.map((target) => (
                          <tr
                            className="border-b border-foreground"
                            key={target.id}
                          >
                            <td className="py-4 pr-4 align-top">
                              <Link
                                className="font-black underline underline-offset-4"
                                href={getTaskPath(target.task.id)}
                              >
                                {target.task.title}
                              </Link>
                            </td>
                            <td className="py-4 pr-4 align-top">
                              <TargetStatusBlock target={target} />
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {formatUsdCents(getUnrefundedPaidCents(target))}
                            </td>
                            <td className="py-4 pr-4 align-top">
                              {target.payments.length}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 border border-foreground p-4 text-sm font-bold text-muted-foreground">
                  No expired or cancelled targets are holding paid money.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
