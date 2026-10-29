import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { approveOrganization, confirmSupporter, organizationSchema, sendOrganizationEndorsement, sendSupporterSignup, supporterSchema } from "../../lib/support";
import { signSupportLink, verifySupportLink } from "../../lib/support-links";
import { countConfirmedPeople, listApprovedOrganizations, toOrganization, toSupporter, type StoredOrganization, type StoredSupporter } from "../../lib/support-store";

const supporter: StoredSupporter = {
  id: "sub_1",
  firstName: "Ada",
  lastName: "Lovelace",
  name: "Ada Lovelace",
  email: "ada@example.com",
  countryCode: "US",
  state: "Illinois",
  updates: true,
  source: "support",
};
const organization: StoredOrganization = {
  id: "org_1",
  organization: "Illinois Patient Group",
  website: "https://example.org",
  logoUrl: "",
  contactFirstName: "Bea",
  contactLastName: "Smith",
  contactEmail: "bea@example.org",
  countryCode: "US",
  state: "Illinois",
};

beforeAll(() => vi.stubEnv("RIGHT_TO_TRY_RATE_LIMIT_SECRET", "test-secret"));
afterAll(() => vi.unstubAllEnvs());

describe("support links", () => {
  it("accept only the signature for the same action and submission", () => {
    const token = signSupportLink("confirm-supporter", "sub_1");
    expect(verifySupportLink("confirm-supporter", "sub_1", token)).toBe(true);
    expect(verifySupportLink("approve-organization", "sub_1", token)).toBe(false);
    expect(verifySupportLink("confirm-supporter", "sub_2", token)).toBe(false);
    expect(verifySupportLink("confirm-supporter", "sub_1", `${token}x`)).toBe(false);
  });

  it("accept nothing when the signing secret is missing", () => {
    const token = signSupportLink("confirm-supporter", "sub_1");
    vi.stubEnv("RIGHT_TO_TRY_RATE_LIMIT_SECRET", "");
    expect(verifySupportLink("confirm-supporter", "sub_1", token)).toBe(false);
    vi.stubEnv("RIGHT_TO_TRY_RATE_LIMIT_SECRET", "test-secret");
  });
});

describe("organization web addresses", () => {
  const base = {
    submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
    organization: "Illinois Patient Group",
    contactFirstName: "Bea",
    contactLastName: "Smith",
    contactEmail: "bea@example.org",
    countryCode: "US",
    state: "Illinois",
  };

  it("adds https:// to a bare domain and accepts an empty logo", () => {
    const parsed = organizationSchema.parse({ ...base, website: " example.org ", logoUrl: "" });
    expect(parsed.website).toBe("https://example.org");
    expect(parsed.logoUrl).toBe("");
  });

  it("rejects links the site must not render, such as javascript:", () => {
    expect(organizationSchema.safeParse({ ...base, website: "javascript:alert(1)" }).success).toBe(false);
    expect(organizationSchema.safeParse({ ...base, website: "https://example.org", logoUrl: "data:image/svg+xml,<svg/>" }).success).toBe(false);
  });
});

describe("where a supporter lives", () => {
  const base = { submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" };

  it("requires a state in the US and drops a stale one elsewhere", () => {
    expect(supporterSchema.safeParse({ ...base, countryCode: "US", state: "" }).success).toBe(false);
    expect(supporterSchema.safeParse({ ...base, countryCode: "US", state: "Nationwide" }).success).toBe(false);
    expect(supporterSchema.parse({ ...base, countryCode: "US", state: "Illinois" }).state).toBe("Illinois");
    expect(supporterSchema.parse({ ...base, countryCode: "DE", state: "Illinois" }).state).toBe("");
    expect(supporterSchema.safeParse({ ...base, countryCode: "ZZ" }).success).toBe(false);
  });

  it("reads sign-ups from before the forms asked for a country and a first and last name", () => {
    expect(toSupporter({ id: "old_1", values: { name: "Ada Lovelace", email: "ada@example.com", state: "Illinois", updates: true } }))
      .toMatchObject({ firstName: "Ada Lovelace", lastName: "", name: "Ada Lovelace", countryCode: "US", state: "Illinois" });
    expect(toSupporter({ id: "old_2", values: { name: "Bo", email: "bo@example.com", state: "Outside the United States" } }))
      .toMatchObject({ countryCode: "", state: "" });
    expect(toOrganization({ id: "old_3", values: { organization: "Group", contactName: "Bea", state: "Nationwide" } }))
      .toMatchObject({ contactFirstName: "Bea", countryCode: "US", state: "Nationwide" });
  });
});

describe("confirming a supporter", () => {
  function dependencies(confirmed: boolean) {
    return {
      getSupporter: vi.fn(async () => supporter),
      hasSupportEvent: vi.fn(async () => confirmed),
      recordSupportEvent: vi.fn(async () => ({ submissionId: "event_1" })),
      subscribe: vi.fn(async () => undefined),
      notifyConfirmed: vi.fn(async () => undefined),
    };
  }

  it("records nothing for a forged link", async () => {
    const deps = dependencies(false);
    const result = await confirmSupporter("sub_1", signSupportLink("approve-organization", "sub_1"), deps);
    expect(result.status).toBe("invalid");
    expect(deps.recordSupportEvent).not.toHaveBeenCalled();
    expect(deps.subscribe).not.toHaveBeenCalled();
  });

  it("confirms once and starts updates only on the first click", async () => {
    const token = signSupportLink("confirm-supporter", "sub_1");
    const first = dependencies(false);
    expect((await confirmSupporter("sub_1", token, first)).status).toBe("done");
    expect(first.recordSupportEvent).toHaveBeenCalledWith("confirm-supporter", "sub_1");
    expect(first.subscribe).toHaveBeenCalledWith("ada@example.com");
    expect(first.notifyConfirmed).toHaveBeenCalledWith(supporter);

    const again = dependencies(true);
    expect((await confirmSupporter("sub_1", token, again)).status).toBe("done");
    expect(again.recordSupportEvent).not.toHaveBeenCalled();
    expect(again.subscribe).not.toHaveBeenCalled();
    expect(again.notifyConfirmed).not.toHaveBeenCalled();
  });

  it("keeps the confirmation when the alert to the Institute fails", async () => {
    const deps = { ...dependencies(false), notifyConfirmed: vi.fn(async () => { throw new Error("Resend is down"); }) };
    const result = await confirmSupporter("sub_1", signSupportLink("confirm-supporter", "sub_1"), deps);
    expect(result.status).toBe("done");
    expect(deps.recordSupportEvent).toHaveBeenCalledWith("confirm-supporter", "sub_1");
  });

  it("leaves the confirmation pending when the updates subscription fails, so the next click retries", async () => {
    const deps = { ...dependencies(false), subscribe: vi.fn(async () => { throw new Error("Resend is down"); }) };
    await expect(confirmSupporter("sub_1", signSupportLink("confirm-supporter", "sub_1"), deps)).rejects.toThrow("Resend is down");
    expect(deps.recordSupportEvent).not.toHaveBeenCalled();
  });

  it("leaves an organization unlisted when the listing email fails, so the next click retries", async () => {
    const deps = {
      getOrganization: vi.fn(async () => organization),
      hasSupportEvent: vi.fn(async () => false),
      recordSupportEvent: vi.fn(async () => ({ submissionId: "event_3" })),
      notifyListed: vi.fn(async () => { throw new Error("The listing email was not accepted"); }),
    };
    await expect(approveOrganization("org_1", signSupportLink("approve-organization", "org_1"), deps)).rejects.toThrow();
    expect(deps.recordSupportEvent).not.toHaveBeenCalled();
  });

  it("lists an organization only through its own approval link", async () => {
    const deps = {
      getOrganization: vi.fn(async () => organization),
      hasSupportEvent: vi.fn(async () => false),
      recordSupportEvent: vi.fn(async () => ({ submissionId: "event_2" })),
      notifyListed: vi.fn(async () => undefined),
    };
    const forged = await approveOrganization("org_1", signSupportLink("confirm-supporter", "org_1"), deps);
    expect(forged.status).toBe("invalid");
    expect(deps.recordSupportEvent).not.toHaveBeenCalled();

    const approved = await approveOrganization("org_1", signSupportLink("approve-organization", "org_1"), deps);
    expect(approved.status).toBe("done");
    expect(deps.recordSupportEvent).toHaveBeenCalledWith("approve-organization", "org_1");
    expect(deps.notifyListed).toHaveBeenCalledWith(organization);
  });
});

describe("the public summary", () => {
  it("counts each confirmed email once and ignores unconfirmed sign-ups", () => {
    const people = [
      supporter,
      { ...supporter, id: "sub_2", email: " ADA@example.com " },
      { ...supporter, id: "sub_3", email: "cy@example.com" },
    ];
    expect(countConfirmedPeople(people, new Set(["sub_1", "sub_2"]))).toBe(1);
  });

  it("lists approved organizations once each, by name, with the latest details", () => {
    const listed = listApprovedOrganizations(
      [
        { ...organization, id: "org_1", organization: "Zeta Clinic" },
        { ...organization, id: "org_2", organization: "Alpha Group", website: "https://old.example" },
        { ...organization, id: "org_3", organization: "alpha group", website: "https://new.example" },
        { ...organization, id: "org_4", organization: "Unapproved" },
      ],
      new Set(["org_1", "org_2", "org_3"]),
    );
    expect(listed.map(item => [item.organization, item.website])).toEqual([
      ["alpha group", "https://new.example"],
      ["Zeta Clinic", "https://example.org"],
    ]);
  });
});

describe("an endorsement alert", () => {
  const sent: Array<{ to: string; text: string }> = [];
  const server = setupServer(
    http.post("https://api.resend.com/emails", async ({ request }) => {
      sent.push((await request.json()) as { to: string; text: string });
      return HttpResponse.json({ id: `email_${sent.length}` });
    }),
  );
  beforeAll(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_support");
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => (sent.length = 0));
  afterAll(() => server.close());

  it("emails the Institute an approval link for the stored submission", async () => {
    const store = vi.fn(async () => ({ submissionId: "org_9" }));
    await sendOrganizationEndorsement(
      {
        submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
        organization: "Illinois Patient Group",
        website: "example.org",
        logoUrl: "",
        contactFirstName: "Bea",
        contactLastName: "Smith",
        contactEmail: "bea@example.org",
        countryCode: "US",
        state: "Illinois",
      },
      { clientKey: "0".repeat(64), store },
    );
    const alert = sent.find(message => message.to === "hello@acceleratedmedicine.org");
    const link = new URL(alert!.text.match(/https:\/\/acceleratedmedicine\.org\/support\/approve\S+/)![0]);
    expect(link.searchParams.get("s")).toBe("org_9");
    expect(verifySupportLink("approve-organization", "org_9", link.searchParams.get("t")!)).toBe(true);
  });

  it("stores an open-letter signature as such and asks the signer to confirm the letter", async () => {
    const store = vi.fn(async () => ({ submissionId: "sub_9" }));
    await sendSupporterSignup(
      {
        submissionKey: "f938e396-c1db-41cb-8f8c-abb33d2d67ae",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        countryCode: "US",
        state: "Illinois",
        source: "open-letter",
      },
      { clientKey: "0".repeat(64), store },
    );
    expect(store.mock.calls[0]![0]).toMatchObject({ source: "open-letter" });
    expect(sent[0]).toMatchObject({ to: "ada@example.com", subject: "Confirm your signature on the open letter" });

    expect(toSupporter({ id: "old_4", values: { firstName: "Bo", email: "bo@example.com", countryCode: "DE" } }).source).toBe("support");
  });
});
