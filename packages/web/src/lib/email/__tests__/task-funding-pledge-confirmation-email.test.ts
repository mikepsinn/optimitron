import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderReactEmailBody } from "../render-react-email";
import {
  buildPledgeConfirmationSubject,
  formatPledgeDeadlineLabel,
  getPledgeConfirmationDedupeKey,
  sendPledgeConfirmationEmail,
  TASK_FUNDING_PLEDGE_CONFIRMATION_TEMPLATE_ID,
} from "../task-funding-pledge-confirmation-email";
import { TaskFundingPledgeConfirmationReactEmail } from "../task-funding-pledge-confirmation-react-email";

vi.mock("../send-deduped-email.server", () => ({
  sendDedupedEmail: vi.fn().mockResolvedValue({
    status: "sent",
    id: "mock-id",
    unsubscribeUrl: null,
  }),
}));

// The real builder HMACs with NEXTAUTH_SECRET; the sender's boundary is
// "calls buildPledgeCancelUrl with the pledge id and embeds the result".
vi.mock("@/lib/task-funding/pledge-cancel-token", () => ({
  buildPledgeCancelUrl: vi.fn(
    (pledgeId: string) =>
      `https://warondisease.org/api/task-funding/pledge/cancel?token=${pledgeId}.SIG`,
  ),
}));

const { sendDedupedEmail } = await import("../send-deduped-email.server");
const sendDedupedEmailMock = vi.mocked(sendDedupedEmail);
const { buildPledgeCancelUrl } = await import(
  "@/lib/task-funding/pledge-cancel-token"
);
const buildPledgeCancelUrlMock = vi.mocked(buildPledgeCancelUrl);

interface TemplateProps {
  amountLabel: string;
  cancelUrl: string;
  cardLabel: string | null;
  deadlineLabel: string | null;
  taskTitle: string;
}

const SAMPLE: TemplateProps = {
  amountLabel: "$25",
  cancelUrl:
    "https://warondisease.org/api/task-funding/pledge/cancel?token=SAMPLE",
  cardLabel: "Visa card ending 4242",
  deadlineLabel: "January 1, 2027",
  taskTitle: "Establish the Court of Humanity",
};

async function renderConfirmationEmail(input: TemplateProps = SAMPLE) {
  return renderReactEmailBody(
    React.createElement(TaskFundingPledgeConfirmationReactEmail, input),
  );
}

describe("task-funding pledge confirmation email template", () => {
  it("names the task, the amount, and the saved card", async () => {
    const { html, text } = await renderConfirmationEmail();
    expect(html).toContain(SAMPLE.taskTitle);
    expect(html).toContain(SAMPLE.amountLabel);
    expect(html).toContain(SAMPLE.cardLabel);
    expect(text).toContain(SAMPLE.taskTitle);
    expect(text).toContain(SAMPLE.amountLabel);
  });

  it("links exactly one action: the signed cancel URL", async () => {
    const { html, text } = await renderConfirmationEmail();
    expect(html).toContain(SAMPLE.cancelUrl);
    expect(text).toContain(SAMPLE.cancelUrl);
  });

  it("states the deal with the deadline and the load-bearing 'never'", async () => {
    const { text } = await renderConfirmationEmail();
    expect(text).toContain("Your card is saved.");
    expect(text).toContain(
      "charged only when this task is fully funded by January 1, 2027",
    );
    expect(text).toContain(
      "if it does not fully fund by then, your card is never charged",
    );
  });

  it("drops the deadline clause when the target has no expiry", async () => {
    const { text } = await renderConfirmationEmail({
      ...SAMPLE,
      deadlineLabel: null,
    });
    expect(text).toContain(
      "It is charged only when this task is fully funded.",
    );
    expect(text).not.toContain("never charged");
  });

  it("omits the card line when card details are missing", async () => {
    const { text } = await renderConfirmationEmail({
      ...SAMPLE,
      cardLabel: null,
    });
    expect(text).not.toContain("Card on file");
  });

  it("contains no exclamation marks and states the do-nothing path as fact", async () => {
    const { text } = await renderConfirmationEmail();
    expect(text).not.toContain("!");
    expect(text).toContain("There is nothing else to do.");
  });

  it("escapes hostile task titles so they cannot inject HTML", async () => {
    const { html } = await renderConfirmationEmail({
      ...SAMPLE,
      taskTitle: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("pledge confirmation helpers", () => {
  it("builds the spec-exact dedupe key, one per pledge", () => {
    expect(getPledgeConfirmationDedupeKey("pledge-1")).toBe(
      "pledge-confirm:pledge-1",
    );
    // Same pledge -> same key (idempotent across webhook replays).
    expect(getPledgeConfirmationDedupeKey("pledge-1")).toBe(
      getPledgeConfirmationDedupeKey("pledge-1"),
    );
  });

  it("interpolates the amount into the subject and stays under 60 chars", () => {
    expect(buildPledgeConfirmationSubject(2500)).toBe(
      "You pledged $25 to end war and disease",
    );
    expect(buildPledgeConfirmationSubject(2550)).toBe(
      "You pledged $25.50 to end war and disease",
    );
    // int4 max cents — the largest amount the schema can hold.
    expect(buildPledgeConfirmationSubject(2_147_483_647).length).toBeLessThan(
      60,
    );
  });

  it("formats deadlines as long UTC dates", () => {
    expect(
      formatPledgeDeadlineLabel(new Date("2027-01-01T00:00:00.000Z")),
    ).toBe("January 1, 2027");
    // Late-evening UTC must not roll into the next day on any server TZ.
    expect(
      formatPledgeDeadlineLabel(new Date("2027-06-30T23:59:00.000Z")),
    ).toBe("June 30, 2027");
  });
});

describe("sendPledgeConfirmationEmail", () => {
  beforeEach(() => {
    sendDedupedEmailMock.mockClear();
    buildPledgeCancelUrlMock.mockClear();
  });

  const input = {
    amountCents: 2500,
    pledge: {
      cardBrand: "visa",
      cardLast4: "4242",
      id: "pledge-1",
      pledgedByUserId: "user-1",
    },
    target: { expiresAt: new Date("2027-01-01T00:00:00.000Z") },
    task: { id: "task-1", title: "Establish the Court of Humanity" },
    toEmail: "pledger@example.com",
  };

  it("sends once per pledge via the shared dedupe mechanism", async () => {
    const result = await sendPledgeConfirmationEmail(input);
    expect(result.status).toBe("sent");
    expect(sendDedupedEmailMock).toHaveBeenCalledTimes(1);
    const call = sendDedupedEmailMock.mock.calls[0]![0];
    expect(call.dedupeKey).toBe("pledge-confirm:pledge-1");
    expect(call.templateId).toBe(TASK_FUNDING_PLEDGE_CONFIRMATION_TEMPLATE_ID);
    expect(call.subject).toBe("You pledged $25 to end war and disease");
    expect(call.scope).toBe("account_security");
    expect(call.toAddress).toBe("pledger@example.com");
    expect(call.userId).toBe("user-1");
  });

  it("builds the cancel link for the pledged row and renders it", async () => {
    await sendPledgeConfirmationEmail(input);
    expect(buildPledgeCancelUrlMock).toHaveBeenCalledWith("pledge-1");
    const call = sendDedupedEmailMock.mock.calls[0]![0];
    if (!call.react) throw new Error("expected a react email body");
    const { html } = await renderReactEmailBody(call.react);
    expect(html).toContain(
      "https://warondisease.org/api/task-funding/pledge/cancel?token=pledge-1.SIG",
    );
    expect(html).toContain("January 1, 2027");
  });

  it("skips without sending when the pledge has no user", async () => {
    const result = await sendPledgeConfirmationEmail({
      ...input,
      pledge: { ...input.pledge, pledgedByUserId: null },
    });
    expect(result).toEqual({ reason: "no_user", status: "skipped" });
    expect(sendDedupedEmailMock).not.toHaveBeenCalled();
  });
});
