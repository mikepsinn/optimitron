import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VoterPrizeTreasuryDeposit } from "./VoterPrizeTreasuryDeposit";

describe("VoterPrizeTreasuryDeposit", () => {
  it("server-renders without requiring a Wagmi provider", () => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;

    expect(() => renderToString(<VoterPrizeTreasuryDeposit />)).not.toThrow();
    expect(renderToString(<VoterPrizeTreasuryDeposit />)).toContain(
      "Loading wallet options",
    );
  });
});
