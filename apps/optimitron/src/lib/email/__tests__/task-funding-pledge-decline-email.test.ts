import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderReactEmailBody } from "../render-react-email";
import {
  formatPledgeAmountLabel,
  formatSavedCardLabel,
  getPledgeDeclineRecoveryDedupeKey,
  getTaskFundingSectionUrl,
  sendPledgeDeclineRecoveryEmail,
  TASK_FUNDING_PLEDGE_DECLINE_SUBJECT,
  TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID,
} from "../task-funding-pledge-decline-email";
import { TaskFundingPledgeDeclineReactEmail } from "../task-funding-pledge-decline-react-email";

vi.mock("../send-deduped-email.server", () => ({
  sendDedupedEmail: vi.fn().mockResolvedValue({
    status: "sent",
    id: "mock-id",
    unsubscribeUrl: null,
  }),
}));

const { sendDedupedEmail } = await import("../send-deduped-email.server");
const sendDedupedEmailMock = vi.mocked(sendDedupedEmail);

const SAMPLE = {
  amountLabel: "$25",
  cardLabel: "Visa card ending 4242",
  payNowUrl: "https://warondisease.org/tasks/task-1#funding",
  taskTitle: "Establish the Court of Humanity",
};

async function renderDeclineEmail(input: typeof SAMPLE = SAMPLE) {
  return renderReactEmailBody(
    React.createElement(TaskFundingPledgeDeclineReactEmail, input),
  );
}

describe("task-funding pledge decline email template", () => {
  it("names the task, the amount, and the saved card", async () => {
    const { html, text } = await renderDeclineEmail();
    expect(html).toContain(SAMPLE.taskTitle);
    expect(html).toContain(SAMPLE.amountLabel);
    expect(html).toContain(SAMPLE.cardLabel);
    expect(text).toContain(SAMPLE.taskTitle);
    expect(text).toContain(SAMPLE.amountLabel);
  });

  it("links the pay-now button to the task's funding section", async () => {
    const { html, text } = await renderDeclineEmail();
    expect(html).toContain(SAMPLE.payNowUrl);
    expect(text).toContain(SAMPLE.payNowUrl);
  });

  it("contains no exclamation marks and no guilt trip", async () => {
    const { text } = await renderDeclineEmail();
    expect(text).not.toContain("!");
    // The do-nothing path is stated as a fact, not a threat.
    expect(text).toContain("If you do nothing, nothing happens.");
  });

  it("escapes hostile task titles so they cannot inject HTML", async () => {
    const { html } = await renderDeclineEmail({
      ...SAMPLE,
      taskTitle: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("pledge decline recovery helpers", () => {
  it("builds one dedupe key per pledge per declinedAt", () => {
    const declinedAt = new Date("2026-07-03T12:00:00.000Z");
    const key = getPledgeDeclineRecoveryDedupeKey({
      declinedAt,
      id: "pledge-1",
    });
    expect(key).toBe(
      `${TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID}:pledge-1:${declinedAt.getTime()}`,
    );
    // Same decline instant -> same key (idempotent). New decline -> new key.
    expect(
      getPledgeDeclineRecoveryDedupeKey({ declinedAt, id: "pledge-1" }),
    ).toBe(key);
    expect(
      getPledgeDeclineRecoveryDedupeKey({
        declinedAt: new Date(declinedAt.getTime() + 1),
        id: "pledge-1",
      }),
    ).not.toBe(key);
  });

  it("formats saved-card labels with graceful fallbacks", () => {
    expect(formatSavedCardLabel("visa", "4242")).toBe(
      "Visa card ending 4242",
    );
    expect(formatSavedCardLabel(null, "4242")).toBe("card ending 4242");
    expect(formatSavedCardLabel("visa", null)).toBe("saved card");
    expect(formatSavedCardLabel(null, null)).toBe("saved card");
  });

  it("formats integer cents, dropping cents on whole dollars", () => {
    expect(formatPledgeAmountLabel(2500)).toBe("$25");
    expect(formatPledgeAmountLabel(2550)).toBe("$25.50");
    expect(formatPledgeAmountLabel(1_000_000)).toBe("$10,000");
  });

  it("points at the task page funding section", () => {
    expect(getTaskFundingSectionUrl("task-1")).toMatch(
      /\/tasks\/task-1#funding$/,
    );
  });
});

describe("sendPledgeDeclineRecoveryEmail", () => {
  beforeEach(() => {
    sendDedupedEmailMock.mockClear();
  });

  const declinedAt = new Date("2026-07-03T12:00:00.000Z");
  const input = {
    amountCents: 2500,
    pledge: {
      cardBrand: "visa",
      cardLast4: "4242",
      declinedAt,
      id: "pledge-1",
      pledgedByUserId: "user-1",
    },
    task: { id: "task-1", title: "Establish the Court of Humanity" },
    toEmail: "pledger@example.com",
  };

  it("sends once per declinedAt via the shared dedupe mechanism", async () => {
    const result = await sendPledgeDeclineRecoveryEmail(input);
    expect(result.status).toBe("sent");
    expect(sendDedupedEmailMock).toHaveBeenCalledTimes(1);
    const call = sendDedupedEmailMock.mock.calls[0]![0];
    expect(call.dedupeKey).toBe(
      `${TASK_FUNDING_PLEDGE_DECLINE_TEMPLATE_ID}:pledge-1:${declinedAt.getTime()}`,
    );
    expect(call.subject).toBe(TASK_FUNDING_PLEDGE_DECLINE_SUBJECT);
    expect(call.scope).toBe("account_security");
    expect(call.toAddress).toBe("pledger@example.com");
    expect(call.userId).toBe("user-1");
  });

  it("skips without sending when the pledge has no user", async () => {
    const result = await sendPledgeDeclineRecoveryEmail({
      ...input,
      pledge: { ...input.pledge, pledgedByUserId: null },
    });
    expect(result).toEqual({ reason: "no_user", status: "skipped" });
    expect(sendDedupedEmailMock).not.toHaveBeenCalled();
  });
});
