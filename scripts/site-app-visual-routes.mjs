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
    {
      authenticated: true,
      authRole: "user",
      covers: ["apps/trialabundancesurvey/app/dashboard/page.tsx"],
      label: "Survey dashboard — signed-in user",
      routeName: "dashboard-authenticated",
      routePath: "/dashboard",
      sourcePage: "apps/trialabundancesurvey/app/dashboard/page.tsx",
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
      "The success content requires a live Stripe checkout session; without one the page can only render its error card.",
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
    sourcePage: "apps/trialabundancesurvey/app/auth/error/page.tsx",
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
  {
    reason:
      "The success content requires a live Stripe checkout session; without one the page can only render its error card.",
    sourcePage: "apps/acceleratedmedicine/app/donate/success/page.tsx",
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
