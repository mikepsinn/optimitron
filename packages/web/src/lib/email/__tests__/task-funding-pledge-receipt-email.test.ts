import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderReactEmailBody } from "../render-react-email";
import {
  buildPledgeReceiptSubject,
  getPledgeReceiptDedupeKey,
  PLEDGE_RECEIPT_SUBJECT_TITLE_MAX_LENGTH,
  sendPledgeChargeReceiptEmail,
  TASK_FUNDING_PLEDGE_RECEIPT_TEMPLATE_ID,
  truncateTaskTitleForSubject,
} from "../task-funding-pledge-receipt-email";
import { TaskFundingPledgeReceiptReactEmail } from "../task-funding-pledge-receipt-react-email";

vi.mock("../send-deduped-email.server", () => ({
  sendDedupedEmail: vi.fn().mockResolvedValue({
    status: "sent",
    id: "mock-id",
    unsubscribeUrl: null,
  }),
}));

const { sendDedupedEmail } = await import("../send-deduped-email.server");
const sendDedupedEmailMock = vi.mocked(sendDedupedEmail);

interface ReceiptTemplateInput {
  amountLabel: string;
  cardLabel: string;
  fundingUrl: string;
  statementDescriptor: string | null;
  taskTitle: string;
}

const SAMPLE: ReceiptTemplateInput = {
  amountLabel: "$25",
  cardLabel: "Visa card ending 4242",
  fundingUrl: "https://warondisease.org/tasks/task-1#funding",
  statementDescriptor: "EXAMPLE* DESCRIPTOR",
  taskTitle: "Establish the Court of Humanity",
};

async function renderReceiptEmail(input: ReceiptTemplateInput = SAMPLE) {
  return renderReactEmailBody(
    React.createElement(TaskFundingPledgeReceiptReactEmail, input),
  );
}

describe("task-funding pledge receipt email template", () => {
  it("names the task, the amount, the card, and the statement descriptor", async () => {
    const { html, text } = await renderReceiptEmail();
    expect(html).toContain(SAMPLE.taskTitle);
    expect(html).toContain(SAMPLE.amountLabel);
    expect(html).toContain(SAMPLE.cardLabel);
    expect(text).toContain(SAMPLE.taskTitle);
    expect(text).toContain(SAMPLE.amountLabel);
    expect(text).toContain(SAMPLE.statementDescriptor!);
  });

  it("states the account-default fact when no descriptor could be resolved", async () => {
    const { text } = await renderReceiptEmail({
      ...SAMPLE,
      statementDescriptor: null,
    });
    expect(text).toContain("Stripe account");
    expect(text).not.toContain("EXAMPLE* DESCRIPTOR");
  });

  it("links only to the task's funding section", async () => {
    const { html, text } = await renderReceiptEmail();
    expect(html).toContain(SAMPLE.fundingUrl);
    expect(text).toContain(SAMPLE.fundingUrl);
  });

  it("states the refund path as fact, without exclamation marks", async () => {
    const { text } = await renderReceiptEmail();
    expect(text).not.toContain("!");
    expect(text).toContain(
      "If this task dies before the work happens, this charge comes back to your card automatically.",
    );
    expect(text).toContain(
      "a verified worker gets paid only after the work is verified",
    );
  });

  it("escapes hostile task titles so they cannot inject HTML", async () => {
    const { html } = await renderReceiptEmail({
      ...SAMPLE,
      taskTitle: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("pledge receipt helpers", () => {
  it("builds exactly one dedupe key per pledge, with no timestamp", () => {
    expect(getPledgeReceiptDedupeKey("pledge-1")).toBe(
      "pledge-receipt:pledge-1",
    );
    // A pledge fulfills at most once — same pledge, same key, forever.
    expect(getPledgeReceiptDedupeKey("pledge-1")).toBe(
      getPledgeReceiptDedupeKey("pledge-1"),
    );
    expect(getPledgeReceiptDedupeKey("pledge-2")).not.toBe(
      getPledgeReceiptDedupeKey("pledge-1"),
    );
  });

  it("builds the subject from integer cents and the task title", () => {
    expect(
      buildPledgeReceiptSubject(2500, "Establish the Court of Humanity"),
    ).toBe("Receipt: $25 charged for Establish the Court of Humanity");
    expect(buildPledgeReceiptSubject(2550, "Fix the door")).toBe(
      "Receipt: $25.50 charged for Fix the door",
    );
  });

  it("truncates long task titles sanely in the subject", () => {
    const longTitle =
      "Recruit, vet, and onboard forty-seven volunteer coordinators across every congressional district before the vote";
    const truncated = truncateTaskTitleForSubject(longTitle);
    expect(truncated.length).toBeLessThanOrEqual(
      PLEDGE_RECEIPT_SUBJECT_TITLE_MAX_LENGTH,
    );
    expect(truncated.endsWith("…")).toBe(true);
    // No dangling whitespace before the ellipsis.
    expect(truncated).not.toMatch(/\s…$/);
    // Short titles pass through untouched (whitespace collapsed).
    expect(truncateTaskTitleForSubject("  Fix   the door  ")).toBe(
      "Fix the door",
    );
  });
});

describe("sendPledgeChargeReceiptEmail", () => {
  beforeEach(() => {
    sendDedupedEmailMock.mockClear();
  });

  const input = {
    amountCents: 2500,
    pledge: {
      cardBrand: "visa",
      cardLast4: "4242",
      id: "pledge-1",
      pledgedByUserId: "user-1",
    },
    statementDescriptor: "EXAMPLE* DESCRIPTOR",
    task: { id: "task-1", title: "Establish the Court of Humanity" },
    toEmail: "pledger@example.com",
  };

  it("sends once per pledge via the shared dedupe mechanism", async () => {
    const result = await sendPledgeChargeReceiptEmail(input);
    expect(result.status).toBe("sent");
    expect(sendDedupedEmailMock).toHaveBeenCalledTimes(1);
    const call = sendDedupedEmailMock.mock.calls[0]![0];
    expect(call.dedupeKey).toBe("pledge-receipt:pledge-1");
    expect(call.subject).toBe(
      "Receipt: $25 charged for Establish the Court of Humanity",
    );
    expect(call.templateId).toBe(TASK_FUNDING_PLEDGE_RECEIPT_TEMPLATE_ID);
    expect(call.scope).toBe("account_security");
    expect(call.toAddress).toBe("pledger@example.com");
    expect(call.userId).toBe("user-1");
  });

  it("skips without sending when the pledge has no user", async () => {
    const result = await sendPledgeChargeReceiptEmail({
      ...input,
      pledge: { ...input.pledge, pledgedByUserId: null },
    });
    expect(result).toEqual({ reason: "no_user", status: "skipped" });
    expect(sendDedupedEmailMock).not.toHaveBeenCalled();
  });
});
