import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PartnerSignupForm } from "../../components/partner-signup-form";

const submissionKey = "f938e396-c1db-41cb-8f8c-abb33d2d67ae";

describe("Partner sign-up browser form", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the type a partner card preselected, then thanks the sender", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true, notified: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(submissionKey);
    render(<PartnerSignupForm initialType="advisory-board" />);

    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Ada Ethicist" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const body = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(body).toMatchObject({
      email: "ada@example.com",
      name: "Ada Ethicist",
      submissionKey,
      type: "advisory-board",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Thank you, Ada Ethicist",
    );
  });

  it("keeps the form and shows the server's error when sending fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { ok: false, error: "We received several responses from this connection." },
          { status: 429 },
        ),
      ),
    );
    render(<PartnerSignupForm initialType="clinic" />);

    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Ada Clinician" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We received several responses from this connection.",
    );
    expect(screen.getByLabelText("Your name")).toHaveValue("Ada Clinician");
  });
});
