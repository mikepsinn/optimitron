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

export function getAuthenticatedSiteAppRoutes(appName) {
  return authenticatedSiteAppRoutes[appName] ?? [];
}
