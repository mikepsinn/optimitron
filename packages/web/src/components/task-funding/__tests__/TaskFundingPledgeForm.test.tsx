/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Simulate } from "react-dom/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TaskFundingPledgeForm } from "../TaskFundingPledgeForm";

const successResponse = {
  pledge: {
    id: "pledge_1",
    targetId: "target_1",
    status: "ACTIVE",
    pledgerKind: "PERSON",
    unitKey: "usd",
    unitQuantity: "15",
    unitAmountCentsSnapshot: null,
    committedAmountCents: "1500",
    publicDisplay: true,
    updatedAt: "2026-05-21T00:00:00.000Z",
  },
  fundingStatus: {
    targetUsdCents: "10000",
    committedUsdCents: "1500",
    remainingUsdCents: "8500",
    percentToTarget: 15,
    status: "OPEN",
    pledgerCount: 1,
  },
  thresholdTransition: {
    triggered: false,
    thresholdMetAt: null,
  },
};

function okResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
}

function errorResponse(error: string, status = 400) {
  return Promise.resolve(
    new Response(JSON.stringify({ error }), {
      headers: { "Content-Type": "application/json" },
      status,
    }),
  );
}

function parsePostBody(fetchMock: ReturnType<typeof vi.fn>) {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  expect(init).toBeDefined();
  return JSON.parse(String(init?.body));
}

describe("TaskFundingPledgeForm", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
        React: typeof React;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("validates USD amounts before posting", async () => {
    await act(async () => {
      root.render(
        <TaskFundingPledgeForm
          labels={{
            amountLabel: "Pledge amount",
            submitButtonLabel: "Pledge",
          }}
          pledgerKind="PERSON"
          taskId="task_1"
          unitConfig={{
            unitKind: "USD",
            minAmountCents: 500n,
            maxAmountCents: 2000n,
          }}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>(
      'input[name="amount"]',
    );
    const submit = container.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    expect(input).not.toBeNull();
    expect(submit).not.toBeNull();

    await act(async () => {
      input!.value = "0";
      Simulate.change(input!);
      Simulate.submit(submit!.closest("form")!);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "Enter an amount greater than zero.",
    );

    await act(async () => {
      input!.value = "2500";
      Simulate.change(input!);
      Simulate.submit(submit!.closest("form")!);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "Enter an amount no more than 2000 cents.",
    );
  });

  it("posts the USD pledge payload and renders the vote CTA on success", async () => {
    const onSuccess = vi.fn();
    fetchMock.mockImplementation(() => okResponse(successResponse));

    await act(async () => {
      root.render(
        <TaskFundingPledgeForm
          initialPublicDisplay={false}
          labels={{
            amountLabel: "Pledge amount",
            publicDisplayLabel: "Show my organization name publicly",
            submitButtonLabel: "Pledge to fund distribution",
            termsNoteLabel: "Optional note for the campaign team",
          }}
          onSuccess={onSuccess}
          organizationId="org_1"
          pledgerKind="ORGANIZATION"
          taskId="task_1"
          termsVersion="terms-v1"
          unitConfig={{
            unitKind: "USD",
            suggestedAmountCents: 1500n,
          }}
        />,
      );
    });

    const amount = container.querySelector<HTMLInputElement>(
      'input[name="amount"]',
    );
    const publicDisplay = container.querySelector<HTMLInputElement>(
      'input[name="publicDisplay"]',
    );
    const termsNote = container.querySelector<HTMLTextAreaElement>(
      'textarea[name="termsNote"]',
    );
    const form = container.querySelector("form");
    expect(amount).not.toBeNull();
    expect(publicDisplay).not.toBeNull();
    expect(termsNote).not.toBeNull();
    expect(form).not.toBeNull();

    await act(async () => {
      amount!.value = "1500";
      Simulate.change(amount!);
      publicDisplay!.checked = true;
      Simulate.change(publicDisplay!);
      termsNote!.value = "Call me before the contract goes live.";
      Simulate.change(termsNote!);
      Simulate.submit(form!);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tasks/task_1/pledge",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    expect(parsePostBody(fetchMock)).toEqual({
      amountCents: "1500",
      mode: "replace",
      organizationId: "org_1",
      pledgerKind: "ORGANIZATION",
      publicDisplay: true,
      termsNote: "Call me before the contract goes live.",
      termsVersion: "terms-v1",
      unitKind: "USD",
    });
    expect(container.textContent).toContain(
      "Pledge recorded. Now go vote yes on the 1% Treaty",
    );
    expect(container.querySelector('a[href="/vote"]')).not.toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(successResponse);
  });

  it("posts commerce-offer quantity pledges", async () => {
    fetchMock.mockImplementation(() => okResponse(successResponse));

    await act(async () => {
      root.render(
        <TaskFundingPledgeForm
          labels={{
            amountLabel: "Number of shirts",
            submitButtonLabel: "Pledge shirts",
          }}
          pledgerKind="PERSON"
          taskId="task_1"
          unitConfig={{
            unitKind: "COMMERCE_OFFER",
            offerKey: "black-shirt",
            variantKey: "xl",
            suggestedQuantity: "3",
            unitLabel: "shirts",
          }}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>(
      'input[name="amount"]',
    );
    const form = container.querySelector("form");
    expect(input).not.toBeNull();
    expect(form).not.toBeNull();

    await act(async () => {
      input!.value = "3";
      Simulate.change(input!);
      Simulate.submit(form!);
    });

    expect(parsePostBody(fetchMock)).toEqual({
      mode: "replace",
      offerKey: "black-shirt",
      pledgerKind: "PERSON",
      publicDisplay: false,
      quantity: "3",
      unitKind: "COMMERCE_OFFER",
      variantKey: "xl",
    });
  });

  it("surfaces API errors without clearing the input", async () => {
    fetchMock.mockImplementation(() => errorResponse("Task not found.", 404));

    await act(async () => {
      root.render(
        <TaskFundingPledgeForm
          labels={{
            amountLabel: "Pledge amount",
            submitButtonLabel: "Pledge",
          }}
          pledgerKind="PERSON"
          taskId="task_1"
          unitConfig={{ unitKind: "USD" }}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>(
      'input[name="amount"]',
    );
    const form = container.querySelector("form");
    expect(input).not.toBeNull();
    expect(form).not.toBeNull();

    await act(async () => {
      input!.value = "1500";
      Simulate.change(input!);
      Simulate.submit(form!);
    });

    expect(container.textContent).toContain("Task not found.");
    expect(input!.value).toBe("1500");
  });
});
