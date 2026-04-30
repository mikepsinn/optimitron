import React, {
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { TreatyVoteFlow } from "@/components/landing/TreatyVoteFlow";
import { SignatoriesLeaderboard } from "@/components/referendum/SignatoriesLeaderboard";
import { TreatySection } from "@/components/site/TreatySection";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TasksRootIntro } from "@/components/tasks/TasksRootIntro";
import type { ReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { TREATY_FLOW_VARIANTS } from "@/lib/treaty-flow-variants";

import { OnePercentTreatyLandingPage } from "./OnePercentTreatyLandingPage";

vi.mock("@/components/landing/TreatyVoteFlow", () => ({
  TreatyVoteFlow: vi.fn(() => null),
}));
vi.mock("@/components/referendum/SignatoriesLeaderboard", () => ({
  SignatoriesLeaderboard: vi.fn(() => null),
}));
vi.mock("@/components/site/TreatySection", () => ({
  TreatySection: vi.fn(() => null),
}));
vi.mock("@/components/tasks/ProgramTaskSection", () => ({
  ProgramTaskSection: vi.fn(() => null),
}));
vi.mock("@/components/tasks/TasksRootIntro", () => ({
  TasksRootIntro: vi.fn(() => null),
}));

const landingData = {
  content: {
    home: {
      heroTitle: "The 1% Treaty",
    },
  },
  lateEmployeeProgramTask: null,
  lateEmployeeTasks: [],
  publicSigners: {
    currentUserSigner: null,
    page: 1,
    pageSize: 48,
    signers: [],
    totalCount: 0,
    totalPages: 1,
  },
  site: {
    primaryReferendumSlug: "one-percent-treaty",
  },
  treatyMarkdown: "",
} as unknown as ReferendumSiteHomeData;

function findElementByType(
  node: ReactNode,
  type: unknown,
): ReactElement<Record<string, unknown>> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElementByType(child, type);
      if (found) return found;
    }
    return null;
  }

  if (!isValidElement(node)) {
    return null;
  }

  if (node.type === type) {
    return node as ReactElement<Record<string, unknown>>;
  }

  const props = node.props as { children?: ReactNode };
  return findElementByType(props.children, type);
}

describe("OnePercentTreatyLandingPage", () => {
  beforeAll(() => {
    vi.stubGlobal("React", React);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("uses the fast vote-first flow and sends voters to training", () => {
    const page = OnePercentTreatyLandingPage({ data: landingData });
    const voteFlow = findElementByType(page, TreatyVoteFlow);

    expect(voteFlow?.props).toMatchObject({
      authCallbackUrl: ROUTES.humanityManagementTraining,
      defaultFlowVariant: TREATY_FLOW_VARIANTS.voteFirstV1,
      postVoteBehavior: "redirect",
      postVoteRedirectUrl: ROUTES.humanityManagementTraining,
      respectStoredFlowVariant: false,
      surface: "landing_vote_page",
    });
  });

  it("keeps the landing page focused on voting", () => {
    const page = OnePercentTreatyLandingPage({ data: landingData });

    expect(findElementByType(page, TasksRootIntro)).toBeNull();
    expect(findElementByType(page, ProgramTaskSection)).toBeNull();
    expect(findElementByType(page, TreatySection)).toBeNull();
    expect(findElementByType(page, SignatoriesLeaderboard)).toBeNull();
  });
});
