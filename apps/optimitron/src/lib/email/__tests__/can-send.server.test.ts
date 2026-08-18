import { describe, expect, it } from "vitest";
import { isSendAllowed } from "../can-send.server";

describe("isSendAllowed", () => {
  const subscribed = {
    newsletterSubscribed: true,
    unsubscribedScopes: [] as readonly string[],
  };

  it("allows transactional scopes regardless of master flag", () => {
    expect(isSendAllowed("magic_link", { newsletterSubscribed: false, unsubscribedScopes: ["all"] })).toBe(true);
    expect(isSendAllowed("account_security", { newsletterSubscribed: false, unsubscribedScopes: [] })).toBe(true);
  });

  it("allows non-transactional scopes when fully subscribed", () => {
    expect(isSendAllowed("task_notifications", subscribed)).toBe(true);
    expect(isSendAllowed("onboarding", subscribed)).toBe(true);
  });

  it("blocks non-transactional scopes when newsletter is off", () => {
    expect(isSendAllowed("task_notifications", { newsletterSubscribed: false, unsubscribedScopes: [] })).toBe(false);
  });

  it("blocks non-transactional scopes when 'all' is in unsubscribedScopes", () => {
    expect(isSendAllowed("task_notifications", { newsletterSubscribed: true, unsubscribedScopes: ["all"] })).toBe(false);
    expect(isSendAllowed("onboarding", { newsletterSubscribed: true, unsubscribedScopes: ["all"] })).toBe(false);
  });

  it("blocks a specific scope when it's in unsubscribedScopes", () => {
    const state = { newsletterSubscribed: true, unsubscribedScopes: ["task_notifications"] };
    expect(isSendAllowed("task_notifications", state)).toBe(false);
    // Other non-transactional scopes still flow through.
    expect(isSendAllowed("onboarding", state)).toBe(true);
  });

  it("lets transactional scopes through even when their scope name is in the array (defensive)", () => {
    // Normally impossible to reach this state via the API, but the predicate
    // should still short-circuit on transactional.
    const state = { newsletterSubscribed: false, unsubscribedScopes: ["magic_link", "all"] };
    expect(isSendAllowed("magic_link", state)).toBe(true);
  });
});
