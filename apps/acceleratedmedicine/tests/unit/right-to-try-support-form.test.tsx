import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RightToTrySupportForm } from "../../components/right-to-try-support-form";

const submissionKey = "f938e396-c1db-41cb-8f8c-abb33d2d67ae";

function successfulFetch() {
  return vi.fn(async () =>
    Response.json({ ok: true, sentConfirmation: false }),
  );
}

describe("Right to Trial browser form payloads", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the state position with a state response", async () => {
    const fetchMock = successfulFetch();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(submissionKey);
    render(<RightToTrySupportForm initialState="Missouri" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Record my state response" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const body = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      intent: "state-support",
      position: "yes",
      state: "Missouri",
    });
  });
});
