import {
  getInternalNavigationRoutesForVariant,
  VARIANTS,
} from "../packages/site-kit/src/lib/site-config.ts";

const campaignPlanPageFile =
  "packages/site-kit/src/components/campaign-plan-page.tsx";
const researchPageFile =
  "packages/site-kit/src/components/research-page.tsx";
const dfdaHowItWorksFiles = [
  "packages/site-kit/src/components/how-it-works/DfdaUserWorkflows.tsx",
  "packages/site-kit/src/components/how-it-works/HowItWorksStep.tsx",
  "packages/site-kit/src/components/how-it-works/OutcomeLabelPreview.tsx",
  "packages/site-kit/src/components/how-it-works/PatientHowItWorks.tsx",
  "packages/site-kit/src/components/how-it-works/PatientSteps.tsx",
  "packages/site-kit/src/components/how-it-works/ProviderHowItWorks.tsx",
  "packages/site-kit/src/components/how-it-works/ProviderSteps.tsx",
  "packages/site-kit/src/components/how-it-works/ResearchPartnerHowItWorks.tsx",
  "packages/site-kit/src/components/how-it-works/ResearchPartnerStep.tsx",
  "packages/site-kit/src/components/how-it-works/ResearchPartnerSteps.tsx",
  "packages/site-kit/src/components/how-it-works/provider-steps/Step1ReviewPatientMatches.tsx",
  "packages/site-kit/src/components/how-it-works/provider-steps/Step2AssignIntervention.tsx",
  "packages/site-kit/src/components/how-it-works/provider-steps/Step3MonitorProgress.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step1FindTrials.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step2ViewOutcomeLabels.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step3JoinTrial.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step4CoordinateCare.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step5TrackData.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step6GainInsights.tsx",
  "packages/site-kit/src/components/how-it-works/steps/Step7FDAiAgent.tsx",
];
const campaignHomeSharedFiles = [
  "packages/site-kit/src/components/campaign-home-page.tsx",
  "packages/site-kit/src/components/landing/decentralized-fda-section.tsx",
  "packages/site-kit/src/components/landing/final-cta.tsx",
  "packages/site-kit/src/components/landing/societal-benefits-concise.tsx",
  "packages/site-kit/src/lib/site-config.ts",
  ...dfdaHowItWorksFiles,
];

function getCampaignHomeFiles(appName) {
  if (appName === "acceleratedmedicine") {
    return [
      "apps/acceleratedmedicine/app/page.tsx",
      "apps/acceleratedmedicine/components/landing/medical-freedom-sections.tsx",
      "apps/acceleratedmedicine/components/landing/right-to-try-sections.tsx",
      "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
      "apps/acceleratedmedicine/lib/right-to-try.ts",
      "apps/acceleratedmedicine/lib/right-to-trial-impact.ts",
      "packages/site-kit/src/components/landing/problem-statement.tsx",
      "packages/site-kit/src/components/landing/SystemProblemsSection.tsx",
      "packages/site-kit/src/components/landing/bottleneck-proof-section.tsx",
      "packages/site-kit/src/components/landing/decentralized-fda-section.tsx",
      "packages/site-kit/src/components/landing/death-clock.tsx",
      "packages/site-kit/src/lib/site-config.ts",
      ...dfdaHowItWorksFiles,
    ];
  }

  return [`apps/${appName}/app/page.tsx`, ...campaignHomeSharedFiles];
}

const warOnDiseaseDashboardFiles = [
  "packages/site-kit/src/components/dashboard/DashboardClient.tsx",
  "packages/site-kit/src/components/dashboard/StatsOverview.tsx",
  "packages/site-kit/src/components/dashboard/ProfileCard.tsx",
  "packages/site-kit/src/components/dashboard/ReferralGoalCard.tsx",
  "packages/site-kit/src/components/dashboard/ReferralInvitationsCard.tsx",
  "packages/site-kit/src/components/dashboard/ImpactLedgerCard.tsx",
  "packages/site-kit/src/components/dashboard/ImpactTreeCard.tsx",
  "packages/site-kit/src/components/dashboard/OrganizationsCard.tsx",
  "packages/site-kit/src/components/dashboard/StickyShareFooter.tsx",
];

function getAuthenticatedMenuRoute(appName) {
  const sourcePage = `apps/${appName}/app/dashboard/page.tsx`;

  return {
    authenticated: true,
    authRole: "user",
    captureSelector: '[role="dialog"]',
    covers: [sourcePage, "packages/site-kit/src/components/layout.tsx"],
    label: "Navigation menu — signed-in user",
    openMenu: true,
    routeName: "navigation-menu-authenticated",
    routePath: "/dashboard",
    sourcePage,
  };
}

export const authenticatedSiteAppRoutes = Object.freeze({
  warondisease: [
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/warondisease/app/dashboard/page.tsx",
        "apps/warondisease/app/dashboard/dashboard-client.tsx",
        ...warOnDiseaseDashboardFiles,
      ],
      label: "Campaign dashboard — signed-in user",
      routeName: "dashboard-authenticated",
      routePath: "/dashboard",
      sourcePage: "apps/warondisease/app/dashboard/page.tsx",
    },
    getAuthenticatedMenuRoute("warondisease"),
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/warondisease/app/dashboard/settings/page.tsx",
        "apps/warondisease/app/dashboard/settings/settings-client.tsx",
        "packages/site-kit/src/components/dashboard/SettingsClient.tsx",
      ],
      label: "Dashboard settings — signed-in user",
      routeName: "dashboard-settings-authenticated",
      routePath: "/dashboard/settings",
      sourcePage: "apps/warondisease/app/dashboard/settings/page.tsx",
    },
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/warondisease/app/profile/edit/page.tsx",
        "apps/warondisease/app/profile/edit/profile-edit-client.tsx",
      ],
      label: "Profile editor — signed-in user",
      routeName: "profile-edit-authenticated",
      routePath: "/profile/edit",
      sourcePage: "apps/warondisease/app/profile/edit/page.tsx",
    },
    {
      authenticated: true,
      authRole: "organization-owner",
      covers: ["apps/warondisease/app/organizations/[slug]/page.tsx"],
      label: "Organization dashboard — signed-in owner",
      routeName: "organization-dashboard-authenticated",
      routePath: "/organizations/demo-organization",
      sourcePage: "apps/warondisease/app/organizations/[slug]/page.tsx",
    },
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/warondisease/app/send/page.tsx",
        "apps/warondisease/app/send/send-referral-invitation-client.tsx",
      ],
      label: "Send an invitation — signed-in user",
      routeName: "send-authenticated",
      routePath: "/send",
      sourcePage: "apps/warondisease/app/send/page.tsx",
    },
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/warondisease/app/join/page.tsx",
        "apps/warondisease/app/join/EndorseForm.tsx",
        "packages/site-kit/src/components/treaty/TreatyContent.tsx",
      ],
      label: "Join as an organization — signed-in user",
      routeName: "join-authenticated",
      routePath: "/join",
      sourcePage: "apps/warondisease/app/join/page.tsx",
    },
    {
      authenticated: true,
      authRole: "admin",
      covers: [
        "apps/warondisease/app/admin/layout.tsx",
        "apps/warondisease/app/admin/organizations/page.tsx",
        "apps/warondisease/app/admin/organizations/admin-organizations-client.tsx",
      ],
      label: "Organizations — signed-in administrator",
      routeName: "admin-organizations-authenticated",
      routePath: "/admin/organizations",
      sourcePage: "apps/warondisease/app/admin/organizations/page.tsx",
    },
    {
      authenticated: true,
      authRole: "admin",
      covers: [
        "apps/warondisease/app/admin/layout.tsx",
        "apps/warondisease/app/admin/users/page.tsx",
        "apps/warondisease/app/admin/users/admin-users-client.tsx",
      ],
      label: "Users — signed-in administrator",
      routeName: "admin-users-authenticated",
      routePath: "/admin/users",
      sourcePage: "apps/warondisease/app/admin/users/page.tsx",
    },
    {
      authenticated: true,
      authRole: "admin",
      covers: [
        "apps/warondisease/app/admin/layout.tsx",
        "apps/warondisease/app/admin/page-scorecard/page.tsx",
      ],
      label: "Page scorecard — signed-in administrator",
      routeName: "admin-page-scorecard-authenticated",
      routePath: "/admin/page-scorecard",
      sourcePage: "apps/warondisease/app/admin/page-scorecard/page.tsx",
    },
  ],
  wishocracy: [
    getAuthenticatedMenuRoute("wishocracy"),
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/wishocracy/app/dashboard/page.tsx",
        "apps/wishocracy/app/dashboard/dashboard-client.tsx",
      ],
      label: "Allocation dashboard — signed-in user",
      routeName: "dashboard-authenticated",
      routePath: "/dashboard",
      sourcePage: "apps/wishocracy/app/dashboard/page.tsx",
    },
  ],
  trialabundancesurvey: [
    getAuthenticatedMenuRoute("trialabundancesurvey"),
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/trialabundancesurvey/app/dashboard/page.tsx",
        "packages/site-kit/src/components/shared/ReferralLinkCard.tsx",
        "packages/site-kit/src/lib/trial-abundance-votes.server.ts",
      ],
      label: "Survey dashboard — signed-in user",
      routeName: "dashboard-authenticated",
      routePath: "/dashboard",
      sourcePage: "apps/trialabundancesurvey/app/dashboard/page.tsx",
    },
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/trialabundancesurvey/app/dashboard/pending-response-recovery.tsx",
      ],
      label: "Survey dashboard — pending response recovery",
      routeName: "dashboard-pending-response",
      routePath: "/dashboard?visual=1&recovery=error",
      sourcePage:
        "apps/trialabundancesurvey/app/dashboard/pending-response-recovery.tsx",
    },
  ],
  acceleratedmedicine: [
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/acceleratedmedicine/app/dashboard/page.tsx",
        "packages/site-kit/src/components/survey/SurveyDashboardPage.tsx",
      ],
      label: "Survey dashboard — signed-in user",
      routeName: "dashboard-authenticated",
      routePath: "/dashboard?visual=1",
      sourcePage: "apps/acceleratedmedicine/app/dashboard/page.tsx",
    },
  ],
  courtofhumanity: [
    getAuthenticatedMenuRoute("courtofhumanity"),
    {
      authenticated: true,
      authRole: "user",
      covers: ["apps/courtofhumanity/app/dashboard/page.tsx"],
      label: "Court standing — signed-in user",
      routeName: "dashboard-authenticated",
      routePath: "/dashboard",
      sourcePage: "apps/courtofhumanity/app/dashboard/page.tsx",
    },
    {
      authenticated: true,
      authRole: "user",
      covers: [
        "apps/courtofhumanity/app/plaintiffs/manage/page.tsx",
        "apps/courtofhumanity/app/plaintiffs/manage/manage-plaintiffs-client.tsx",
        "apps/courtofhumanity/app/plaintiffs/manage/square-photo-cropper.tsx",
      ],
      label: "Your plaintiffs — signed-in user",
      routeName: "plaintiffs-manage-authenticated",
      routePath: "/plaintiffs/manage",
      sourcePage: "apps/courtofhumanity/app/plaintiffs/manage/page.tsx",
    },
  ],
});

export const authenticatedSiteAppRouteExemptions = Object.freeze([
  {
    reason: "This page only redirects to the captured Wishocracy dashboard.",
    sourcePage: "apps/wishocracy/app/dashboard/settings/page.tsx",
  },
]);

/**
 * Logged-out pages that the site navigation does not link, so the nav-derived
 * screenshot set never reaches them. Every entry is captured in both visual
 * projects, exactly like the nav routes.
 */
export const publicSiteAppRoutes = Object.freeze({
  warondisease: [
    {
      covers: [
        "apps/warondisease/app/research/page.tsx",
        researchPageFile,
      ],
      label: "Research and evidence",
      routeName: "research",
      routePath: "/research",
      sourcePage: "apps/warondisease/app/research/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/vote/page.tsx",
        "packages/site-kit/src/components/landing/treaty-vote-section.tsx",
      ],
      label: "Treaty vote",
      routeName: "vote",
      routePath: "/vote",
      sourcePage: "apps/warondisease/app/vote/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/treaty/page.tsx",
        "apps/warondisease/app/treaty/treaty-markdown.tsx",
        "packages/site-kit/src/components/landing/TreatySignatureBox.tsx",
      ],
      label: "Treaty text and signature",
      routeName: "treaty",
      routePath: "/treaty",
      sourcePage: "apps/warondisease/app/treaty/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/soldiers/page.tsx",
        "apps/warondisease/app/soldiers/soldiers-leaderboard.tsx",
      ],
      label: "Soldiers leaderboard",
      routeName: "soldiers",
      routePath: "/soldiers",
      sourcePage: "apps/warondisease/app/soldiers/page.tsx",
    },
    // The distribution and pressure pages migrated from Optimitron in #276.
    // None of them is linked from the navigation, so the nav walk cannot reach
    // them and only these entries put them in front of a reviewer.
    {
      covers: [
        "apps/warondisease/app/search/campaign-search.server.ts",
        "apps/warondisease/app/search/page.tsx",
      ],
      label: "Campaign search",
      routeName: "search",
      routePath: "/search?q=research",
      sourcePage: "apps/warondisease/app/search/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/signatories/page.tsx",
        "packages/site-kit/src/components/referendum/SignatoriesLeaderboard.tsx",
      ],
      label: "Signatories leaderboard",
      routeName: "signatories",
      routePath: "/signatories",
      sourcePage: "apps/warondisease/app/signatories/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/donate/page.tsx"],
      label: "Donate",
      routeName: "donate",
      routePath: "/donate",
      sourcePage: "apps/warondisease/app/donate/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/foundations/page.tsx",
        "packages/site-kit/src/components/foundations/CopyGrantEmailButton.tsx",
        "packages/site-kit/src/components/foundations/LoveLetterCalculator.tsx",
      ],
      label: "Foundations",
      routeName: "foundations",
      routePath: "/foundations",
      sourcePage: "apps/warondisease/app/foundations/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/poster/page.tsx",
        "apps/warondisease/app/poster/poster-client.tsx",
      ],
      label: "Printable poster",
      routeName: "poster",
      routePath: "/poster",
      sourcePage: "apps/warondisease/app/poster/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/door-to-door/page.tsx",
        "packages/site-kit/src/components/sharing/campaign-qr-code.tsx",
      ],
      label: "Door-to-door canvassing",
      routeName: "door-to-door",
      routePath: "/door-to-door",
      sourcePage: "apps/warondisease/app/door-to-door/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/love/page.tsx",
        "apps/warondisease/app/love/love-client.tsx",
      ],
      label: "Love letter",
      routeName: "love",
      routePath: "/love",
      sourcePage: "apps/warondisease/app/love/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/joke/page.tsx",
        "apps/warondisease/app/joke/joke-client.tsx",
      ],
      label: "Joke",
      routeName: "joke",
      routePath: "/joke",
      sourcePage: "apps/warondisease/app/joke/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/shirt/page.tsx",
        "apps/warondisease/app/shirt/shirt-client.tsx",
        "apps/warondisease/components/shirt/TshirtSilhouette.tsx",
        "packages/site-kit/src/components/task-funding/TaskFundingProgress.tsx",
        "packages/site-kit/src/lib/task-funding/status.server.ts",
      ],
      label: "Get the shirt",
      routeName: "shirt",
      routePath: "/shirt",
      sourcePage: "apps/warondisease/app/shirt/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/fix-ai/page.tsx",
        "apps/warondisease/app/fix-ai/content.ts",
        "apps/warondisease/app/fix-ai/corpus.server.ts",
        "apps/warondisease/app/fix-ai/json-ld-head.tsx",
      ],
      label: "Fix the AI corpus",
      routeName: "fix-ai",
      routePath: "/fix-ai",
      sourcePage: "apps/warondisease/app/fix-ai/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/employees/page.tsx",
        "packages/site-kit/src/components/landing/treaty-reminder-composer.tsx",
        "packages/site-kit/src/components/tasks/overdue-signer-list.tsx",
        "packages/site-kit/src/components/tasks/reminder-composer.tsx",
      ],
      label: "President management system",
      routeName: "employees",
      routePath: "/employees",
      sourcePage: "apps/warondisease/app/employees/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/missions/page.tsx",
        "apps/warondisease/app/missions/mission-safety.ts",
        "apps/warondisease/app/missions/mission-safety-notice.tsx",
        "apps/warondisease/app/missions/missions.server.ts",
      ],
      label: "Earth Optimization Missions",
      routeName: "missions",
      routePath: "/missions",
      sourcePage: "apps/warondisease/app/missions/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/feedback/page.tsx",
        "packages/site-kit/src/lib/feedback.server.ts",
      ],
      label: "Feedback form",
      routeName: "feedback",
      routePath: "/feedback",
      sourcePage: "apps/warondisease/app/feedback/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/mcp/page.tsx",
        "packages/site-kit/src/components/shared/CopyableCode.tsx",
        "packages/site-kit/src/lib/mcp-catalog.ts",
        "packages/site-kit/src/lib/mcp/catalog.generated.json",
      ],
      label: "MCP setup",
      routeName: "mcp",
      routePath: "/mcp",
      sourcePage: "apps/warondisease/app/mcp/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/developers/page.tsx",
        "packages/site-kit/src/components/shared/CopyableCode.tsx",
        "packages/site-kit/src/lib/mcp-catalog.ts",
      ],
      label: "Earth Optimization API",
      routeName: "developers",
      routePath: "/developers",
      sourcePage: "apps/warondisease/app/developers/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/developers/tools/page.tsx",
        "packages/site-kit/src/lib/mcp-catalog.ts",
        "packages/site-kit/src/lib/mcp/catalog.generated.json",
      ],
      label: "MCP tool reference",
      routeName: "developers-tools",
      routePath: "/developers/tools",
      sourcePage: "apps/warondisease/app/developers/tools/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/survey/demo/page.tsx"],
      label: "Survey embed demo",
      routeName: "survey-demo",
      routePath: "/survey/demo",
      sourcePage: "apps/warondisease/app/survey/demo/page.tsx",
    },
    {
      covers: [
        "apps/warondisease/app/survey/[slug]/page.tsx",
        "apps/warondisease/app/survey/[slug]/layout.tsx",
      ],
      label: "Partner institute survey",
      routeName: "survey-organization",
      routePath: "/survey/institute-for-accelerated-medicine",
      sourcePage: "apps/warondisease/app/survey/[slug]/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/u/[username]/page.tsx"],
      label: "Public user profile",
      routeName: "user-profile",
      routePath: "/u/demo",
      sourcePage: "apps/warondisease/app/u/[username]/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/institutes/success/page.tsx"],
      label: "Institute signup success",
      routeName: "institutes-success",
      routePath: "/institutes/success?slug=institute-for-accelerated-medicine",
      sourcePage: "apps/warondisease/app/institutes/success/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/auth/signin/page.tsx"],
      label: "Sign in",
      routeName: "auth-signin",
      routePath: "/auth/signin",
      sourcePage: "apps/warondisease/app/auth/signin/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/auth/error/page.tsx"],
      label: "Auth error",
      routeName: "auth-error",
      routePath: "/auth/error?error=Verification",
      sourcePage: "apps/warondisease/app/auth/error/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/auth/verify-request/page.tsx"],
      label: "Check your email",
      routeName: "auth-verify-request",
      routePath: "/auth/verify-request",
      sourcePage: "apps/warondisease/app/auth/verify-request/page.tsx",
    },
    {
      covers: ["apps/warondisease/app/not-found.tsx"],
      expectNotFound: true,
      label: "Page not found",
      routeName: "not-found",
      routePath: "/this-page-does-not-exist",
      sourcePage: "apps/warondisease/app/not-found.tsx",
    },
    {
      covers: ["apps/warondisease/app/survey/[slug]/not-found.tsx"],
      expectNotFound: true,
      label: "Survey not found",
      routeName: "survey-not-found",
      routePath: "/survey/this-org-does-not-exist",
      sourcePage: "apps/warondisease/app/survey/[slug]/not-found.tsx",
    },
  ],
  courtofhumanity: [
    {
      covers: [
        "apps/courtofhumanity/app/plaintiffs/page.tsx",
        "apps/courtofhumanity/app/plaintiffs/people-filter-bar.tsx",
        "apps/courtofhumanity/app/plaintiffs/person-face-tile.tsx",
        "apps/courtofhumanity/app/plaintiffs/register-plaintiff-form.tsx",
        "packages/site-kit/src/lib/represented-people.server.ts",
      ],
      label: "Register a plaintiff",
      routeName: "plaintiffs",
      routePath: "/plaintiffs",
      sourcePage: "apps/courtofhumanity/app/plaintiffs/page.tsx",
    },
  ],
  dfda: [
    {
      covers: ["apps/dfda/app/contact/page.tsx"],
      label: "Contact",
      routeName: "contact",
      routePath: "/contact",
      sourcePage: "apps/dfda/app/contact/page.tsx",
    },
    {
      covers: [
        "apps/dfda/app/conditions/[conditionSlug]/page.tsx",
        "apps/dfda/components/condition/TreatmentRankings.tsx",
      ],
      label: "Condition detail",
      routeName: "condition-detail",
      routePath: "/conditions/endometriosis",
      sourcePage: "apps/dfda/app/conditions/[conditionSlug]/page.tsx",
    },
    {
      covers: ["apps/dfda/app/treatments/[treatmentSlug]/page.tsx"],
      label: "Treatment detail",
      routeName: "treatment-detail",
      routePath: "/treatments/laparoscopic-excision-surgery",
      sourcePage: "apps/dfda/app/treatments/[treatmentSlug]/page.tsx",
    },
    {
      covers: ["apps/dfda/app/auth/signin/page.tsx"],
      label: "Sign in",
      routeName: "auth-signin",
      routePath: "/auth/signin",
      sourcePage: "apps/dfda/app/auth/signin/page.tsx",
    },
    {
      covers: ["apps/dfda/app/not-found.tsx"],
      expectNotFound: true,
      label: "Page not found",
      routeName: "not-found",
      routePath: "/this-page-does-not-exist",
      sourcePage: "apps/dfda/app/not-found.tsx",
    },
  ],
  wishocracy: [
    {
      covers: ["apps/wishocracy/app/contact/page.tsx"],
      label: "Contact",
      routeName: "contact",
      routePath: "/contact",
      sourcePage: "apps/wishocracy/app/contact/page.tsx",
    },
    {
      covers: ["apps/wishocracy/app/auth/signin/page.tsx"],
      label: "Sign in",
      routeName: "auth-signin",
      routePath: "/auth/signin",
      sourcePage: "apps/wishocracy/app/auth/signin/page.tsx",
    },
    {
      covers: ["apps/wishocracy/app/not-found.tsx"],
      expectNotFound: true,
      label: "Page not found",
      routeName: "not-found",
      routePath: "/this-page-does-not-exist",
      sourcePage: "apps/wishocracy/app/not-found.tsx",
    },
  ],
  trialabundancesurvey: [
    {
      covers: [
        "apps/trialabundancesurvey/app/research/page.tsx",
        researchPageFile,
        "packages/site-kit/src/lib/nav-items.ts",
      ],
      label: "Research methodology",
      routeName: "research",
      routePath: "/research",
      sourcePage: "apps/trialabundancesurvey/app/research/page.tsx",
    },
    {
      covers: ["apps/trialabundancesurvey/app/contact/page.tsx"],
      label: "Contact",
      routeName: "contact",
      routePath: "/contact",
      sourcePage: "apps/trialabundancesurvey/app/contact/page.tsx",
    },
    {
      covers: ["apps/trialabundancesurvey/app/auth/signin/page.tsx"],
      label: "Sign in",
      routeName: "auth-signin",
      routePath: "/auth/signin",
      sourcePage: "apps/trialabundancesurvey/app/auth/signin/page.tsx",
    },
    {
      covers: [
        "apps/trialabundancesurvey/app/auth/error/page.tsx",
        "apps/trialabundancesurvey/app/auth/error/error-content.tsx",
      ],
      label: "Expired sign-in link recovery",
      routeName: "auth-error",
      routePath: "/auth/error?error=Verification",
      sourcePage: "apps/trialabundancesurvey/app/auth/error/page.tsx",
    },
    {
      covers: ["apps/trialabundancesurvey/app/not-found.tsx"],
      expectNotFound: true,
      label: "Page not found",
      routeName: "not-found",
      routePath: "/this-page-does-not-exist",
      sourcePage: "apps/trialabundancesurvey/app/not-found.tsx",
    },
  ],
  curedao: [
    {
      covers: ["apps/curedao/app/not-found.tsx"],
      expectNotFound: true,
      label: "Page not found",
      routeName: "not-found",
      routePath: "/this-page-does-not-exist",
      sourcePage: "apps/curedao/app/not-found.tsx",
    },
  ],
  acceleratedmedicine: [
    {
      covers: ["apps/acceleratedmedicine/app/donate/page.tsx"],
      label: "Donate",
      routeName: "donate",
      routePath: "/donate",
      sourcePage: "apps/acceleratedmedicine/app/donate/page.tsx",
    },
    {
      covers: [
        "apps/acceleratedmedicine/app/donate/success/page.tsx",
        "apps/acceleratedmedicine/components/donate/success-confetti.tsx",
        "apps/warondisease/app/donate/success/page.tsx",
      ],
      label: "Donation received",
      routeName: "donate-success",
      routePath: "/donate/success?session_id=cs_test_visual_review",
      sourcePage: "apps/acceleratedmedicine/app/donate/success/page.tsx",
    },
    {
      covers: ["apps/acceleratedmedicine/app/not-found.tsx"],
      expectNotFound: true,
      label: "Page not found",
      routeName: "not-found",
      routePath: "/this-page-does-not-exist",
      sourcePage: "apps/acceleratedmedicine/app/not-found.tsx",
    },
  ],
});

export const publicSiteAppRouteExemptions = Object.freeze([
  {
    reason:
      "This legacy route immediately redirects to the captured acceleratedmedicine donation-success page and has no local visual state.",
    sourcePage: "apps/warondisease/app/donate/success/page.tsx",
  },
  {
    reason:
      "Transitional processing page that immediately redirects to sign-in or the dashboard; it has no stable visual state.",
    sourcePage: "apps/warondisease/app/auth/complete-signup/page.tsx",
  },
  {
    reason:
      "Renders the same DfdaLandingContent as the captured home route.",
    sourcePage: "apps/dfda/app/dfda/page.tsx",
  },
  {
    reason:
      "Fetches live clinicaltrials.gov data at request time, so there is no deterministic capture fixture.",
    sourcePage:
      "apps/dfda/app/conditions/[conditionSlug]/treatments/[treatmentSlug]/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/dfda/app/auth/error/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/dfda/app/auth/verify-request/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/dfda/app/auth/complete-signup/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/wishocracy/app/auth/error/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/wishocracy/app/auth/verify-request/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/wishocracy/app/auth/complete-signup/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/trialabundancesurvey/app/auth/verify-request/page.tsx",
  },
  {
    reason:
      "Shared auth scaffolding; this app captures /auth/signin and warondisease captures the full auth set.",
    sourcePage: "apps/trialabundancesurvey/app/auth/complete-signup/page.tsx",
  },
]);

export function getAuthenticatedSiteAppRoutes(appName) {
  return authenticatedSiteAppRoutes[appName] ?? [];
}

export function getPublicSiteAppRoutes(appName) {
  return publicSiteAppRoutes[appName] ?? [];
}

/**
 * Map a captured route path to the Next.js page file that renders it.
 * Dynamic routes cannot be derived this way, so their declarations carry an
 * explicit sourcePage instead.
 */
export function getSourcePageForRoutePath(appName, routePath) {
  const [withoutHash] = String(routePath).split("#", 1);
  const [pathname] = withoutHash.split("?", 1);
  const segments = pathname.replace(/^\/+|\/+$/g, "");
  return segments
    ? `apps/${appName}/app/${segments}/page.tsx`
    : `apps/${appName}/app/page.tsx`;
}

/**
 * The full screenshot set for one site app: every nav-linked page, the
 * hand-registered extra states, and the declared public and authenticated
 * routes above.
 */
export function getSiteAppScreenshotRoutes(appName, siteVariant) {
  const isCampaignHome =
    siteVariant === VARIANTS.WAR_ON_DISEASE ||
    siteVariant === VARIANTS.CUREDAO ||
    siteVariant === VARIANTS.ACCELERATED_MEDICINE;
  const campaignHomeFiles = getCampaignHomeFiles(appName);
  const routes = getInternalNavigationRoutesForVariant(siteVariant).map(
    ({ label, path: routePath }) => ({
      label,
      ...(isCampaignHome && routePath === "/"
        ? { covers: campaignHomeFiles }
        : {}),
      routeName:
        routePath === "/"
          ? "home"
          : routePath
              .replace(/^\/+|\/+$/g, "")
              .replaceAll("/", "-")
              .replace(/[^a-z0-9-]+/gi, "-")
              .toLowerCase(),
      routePath,
    }),
  );

  if (siteVariant === VARIANTS.WAR_ON_DISEASE) {
    routes.push({
      label: "Home footer",
      routeName: "home-footer",
      routePath: "/",
      captureSelector: "footer",
      covers: campaignHomeFiles,
    });
    const planRoute = routes.find(({ routePath }) => routePath === "/the-plan");
    if (planRoute) {
      planRoute.covers = [campaignPlanPageFile];
    } else {
      routes.push({
        label: "Shared campaign plan",
        routeName: "the-plan",
        routePath: "/the-plan",
        covers: [campaignPlanPageFile],
      });
    }
  }

  if (siteVariant === VARIANTS.DFDA) {
    const landingRoute = routes.find(({ routePath }) => routePath === "/");
    if (landingRoute) {
      landingRoute.covers = [
        "apps/dfda/app/dfda/components/DfdaLandingContent.tsx",
        ...dfdaHowItWorksFiles,
      ];
    }
  }

  if (siteVariant === VARIANTS.ACCELERATED_MEDICINE) {
    const rightToTryRouteFiles = new Map([
      [
        "/impact",
        [
          "apps/acceleratedmedicine/app/impact/page.tsx",
          "apps/acceleratedmedicine/components/impact/right-to-trial-impact-explorer.tsx",
          "apps/acceleratedmedicine/lib/right-to-trial-impact.ts",
          "packages/site-kit/src/components/landing/decentralized-fda-section.tsx",
          "packages/site-kit/src/components/how-it-works/DfdaUserWorkflows.tsx",
        ],
      ],
      [
        "/contact",
        [
          "apps/acceleratedmedicine/app/contact/page.tsx",
          "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
        ],
      ],
      [
        "/montana",
        [
          "apps/acceleratedmedicine/app/montana/page.tsx",
          "apps/acceleratedmedicine/components/landing/right-to-try-sections.tsx",
          "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
          "apps/acceleratedmedicine/lib/right-to-try.ts",
        ],
      ],
      [
        "/model-act",
        [
          "apps/acceleratedmedicine/app/model-act/page.tsx",
          "apps/acceleratedmedicine/components/landing/right-to-try-sections.tsx",
          "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
        ],
      ],
      [
        "/states/missouri",
        [
          "apps/acceleratedmedicine/app/states/missouri/page.tsx",
          "apps/acceleratedmedicine/components/state-campaign-page.tsx",
          "apps/acceleratedmedicine/components/landing/right-to-try-sections.tsx",
          "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
          "apps/acceleratedmedicine/lib/right-to-try.ts",
        ],
      ],
    ]);
    for (const route of routes) {
      const covers = rightToTryRouteFiles.get(route.routePath);
      if (covers) route.covers = covers;
    }
    routes.push({
      label: "State education template",
      routeName: "states-alabama",
      routePath: "/states/alabama",
      covers: [
        "apps/acceleratedmedicine/app/states/[state]/page.tsx",
        "apps/acceleratedmedicine/components/state-campaign-page.tsx",
        "apps/acceleratedmedicine/components/landing/right-to-try-sections.tsx",
        "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
        "apps/acceleratedmedicine/lib/right-to-try.ts",
      ],
      sourcePage: "apps/acceleratedmedicine/app/states/[state]/page.tsx",
    });
    routes.push({
      label: "Missouri clinician response",
      routeName: "states-missouri-clinician",
      routePath: "/states/missouri?role=clinician#state-support",
      covers: [
        "apps/acceleratedmedicine/app/states/missouri/page.tsx",
        "apps/acceleratedmedicine/components/state-campaign-page.tsx",
        "apps/acceleratedmedicine/components/landing/right-to-try-sections.tsx",
        "apps/acceleratedmedicine/components/right-to-try-support-form.tsx",
      ],
      sourcePage: "apps/acceleratedmedicine/app/states/[state]/page.tsx",
    });
    const planRoute = routes.find(({ routePath }) => routePath === "/the-plan");
    if (planRoute) {
      planRoute.covers = [campaignPlanPageFile];
    } else {
      routes.push({
        label: "Legacy campaign plan",
        routeName: "the-plan",
        routePath: "/the-plan",
        covers: [campaignPlanPageFile],
      });
    }
    routes.push({
      label: "Legacy About redirect",
      routeName: "about-redirect",
      routePath: "/about",
    });
  }

  if ([VARIANTS.SURVEY, VARIANTS.ACCELERATED_MEDICINE].includes(siteVariant)) {
    const surveyComponent =
      "packages/site-kit/src/components/landing/trial-abundance-survey-section.tsx";
    const landingRoute = routes.find(({ routePath }) => routePath === "/");
    if (landingRoute) {
      landingRoute.covers = [...(landingRoute.covers ?? []), surveyComponent];
    }
    routes.push(
      {
        label: "Patient-access question",
        routeName: "home-question",
        routePath: "/?visual=question",
        covers: [surveyComponent],
      },
      {
        label: "Patient-funded access question",
        routeName: "home-self-funded",
        routePath: "/?visual=self-funded",
        covers: [surveyComponent],
      },
      {
        label: "Public-resource allocation",
        routeName: "home-allocation",
        routePath: "/?visual=allocation",
        covers: [surveyComponent],
      },
      {
        label: "Participant details and consent",
        routeName: "home-details",
        routePath: "/?visual=details",
        covers: [surveyComponent, "packages/site-kit/src/components/landing/survey-participant-fields.tsx"],
      },
      {
        label: "Response save retry",
        routeName: "home-save-error",
        routePath: "/?visual=save-error",
        covers: [surveyComponent],
      },
      {
        label: "Completed response and verification",
        routeName: "home-complete",
        routePath: "/?visual=complete",
        covers: [surveyComponent],
      },
      {
        label: "Response verification",
        routeName: "auth-complete-signup",
        routePath: "/auth/complete-signup?visual=1",
        covers: [
          `apps/${appName}/app/auth/complete-signup/page.tsx`,
          "packages/site-kit/src/components/auth/SurveyCompleteSignupPage.tsx",
        ],
      },
      {
        label: "Response verification retry",
        routeName: "auth-complete-signup-retry",
        routePath: "/auth/complete-signup?visual=1&recovery=error",
        covers: ["packages/site-kit/src/components/auth/SurveyCompleteSignupPage.tsx"],
      },
    );
    if (siteVariant === VARIANTS.SURVEY) routes.push({
      label: "Partner embed",
      routeName: "embed",
      routePath: "/embed?embed=1&visual=question",
      covers: [
        "apps/trialabundancesurvey/app/embed/page.tsx",
        surveyComponent,
      ],
    });
    for (const [routeName, routePath, component] of [
      ["auth-signin", "/auth/signin", "auth/SurveySignInPage.tsx"],
      ["auth-error", "/auth/error?error=Verification", "auth/SurveyAuthErrorPage.tsx"],
      ["auth-verify-request", "/auth/verify-request", "auth/SurveyVerifyRequestPage.tsx"],
      ["dashboard-saved-preview", "/dashboard?visual=1", "survey/SurveyDashboardPage.tsx"],
      ["dashboard-retry-preview", "/dashboard?visual=1&recovery=error", "survey/pending-response-recovery.tsx"],
    ]) {
      routes.push({
        label: routeName.replaceAll("-", " "), routeName, routePath,
        ...(routeName.startsWith("dashboard") ? { authenticated: true, authRole: "user" } : {}),
        covers: [
          `packages/site-kit/src/components/${component}`,
          ...(routeName === "auth-error" ? [
            "packages/site-kit/src/components/auth/SurveyAuthErrorContent.tsx",
            `apps/${appName}/app/auth/error/error-content.tsx`,
          ] : []),
          ...(routeName === "dashboard-retry-preview" ? [
            `apps/${appName}/app/dashboard/pending-response-recovery.tsx`,
          ] : []),
          ...(routeName === "auth-signin" ? ["packages/site-kit/src/components/auth/AuthForm.tsx"] : []),
        ],
      });
    }
  }

  const publicRoutes = getPublicSiteAppRoutes(appName);
  const publicRouteNames = new Set(publicRoutes.map(({ routeName }) => routeName));
  const screenshotRoutes = [
    // Hand-authored public captures can carry fixtures, query parameters, and
    // component coverage. Prefer them over a generic nav-derived capture.
    ...routes.filter(({ routeName }) => !publicRouteNames.has(routeName)),
    ...publicRoutes.map((route) => ({
      ...route,
      covers: [...(route.covers ?? []), ...(routes.find((candidate) => candidate.routeName === route.routeName)?.covers ?? [])],
    })),
    ...getAuthenticatedSiteAppRoutes(appName),
  ].map((route) => {
    const sourcePage =
      route.sourcePage ?? getSourcePageForRoutePath(appName, route.routePath);
    // A capture always exercises its own page file, and the home capture
    // additionally exercises the root layout, so those files never need a
    // hand-maintained covers entry.
    const covers = [
      ...new Set([
        ...(route.covers ?? []),
        sourcePage,
        ...(route.routeName === "home"
          ? [
              `apps/${appName}/app/layout.tsx`,
              `apps/${appName}/app/globals.css`,
            ]
          : []),
      ]),
    ];
    return { ...route, covers, sourcePage };
  });
  const routeNames = new Set();
  for (const route of screenshotRoutes) {
    if (routeNames.has(route.routeName)) {
      throw new Error(
        `@apps/${appName}: duplicate screenshot route name ${route.routeName}`,
      );
    }
    routeNames.add(route.routeName);
  }
  return screenshotRoutes;
}
