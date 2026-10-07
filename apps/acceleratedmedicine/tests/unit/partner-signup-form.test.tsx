import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PartnerSignupForm } from "../../components/partner-signup-form";

const submissionKey = "f938e396-c1db-41cb-8f8c-abb33d2d67ae";

describe("Partner sign-up browser form", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the type a partner card preselected plus any other checked, then thanks the sender", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true, notified: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(submissionKey);
    render(<PartnerSignupForm initialType="advisory-board" />);

    fireEvent.click(screen.getByRole("checkbox", { name: /Clinic or doctor/ }));
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
      types: ["clinic", "advisory-board"],
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Thank you, Ada Ethicist",
    );
  });

  it("shows the server's error, retries with the same key, and uses a new key after an edit", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { ok: false, error: "We could not send this. Please try again." },
        { status: 503 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000001")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000002");
    render(<PartnerSignupForm initialType="clinic" />);
    const sentKeys = () =>
      fetchMock.mock.calls.map(
        (call) => (JSON.parse(String(call[1]?.body)) as { submissionKey: string }).submissionKey,
      );

    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Ada Clinician" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not send this. Please try again.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByRole("alert");
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Ada B. Clinician" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    expect(sentKeys()).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ]);
  });

  it("shows the general message when a platform error page is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>Gateway timeout</html>", { status: 504 })),
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
      "We could not send this. Please try again or email hello@acceleratedmedicine.org.",
    );
  });
});
