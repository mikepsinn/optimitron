export const API_ROUTES = {
  wishocracy: {
    allocations: "/api/wishocracy/allocations",
    categorySelections: "/api/wishocracy/category-selections",
    averageAllocations: "/api/wishocracy/average-allocations",
    sync: "/api/wishocracy/sync",
  },
  auth: {
    postSignin: "/api/auth/post-signin",
  },
  profile: {
    root: "/api/profile",
    checkIn: "/api/profile/check-in",
  },
  push: {
    vapidKey: "/api/push/vapid-key",
    subscribe: "/api/push/subscribe",
    unsubscribe: "/api/push/unsubscribe",
  },
  civic: {
    votes: "/api/civic/votes",
    representatives: "/api/civic/representatives",
    bills: "/api/civic/bills",
  },
  personhood: {
    worldIdRequest: "/api/personhood/world-id/request",
    worldIdVerify: "/api/personhood/world-id/verify",
  },
  treasury: {
    registerUbi: "/api/treasury/register-ubi",
  },
} as const;
