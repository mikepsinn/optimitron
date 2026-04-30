export const API_ROUTES = {
  wishocracy: {
    allocations: "/api/wishocracy/allocations",
    itemInclusions: "/api/wishocracy/item-inclusions",
    averageAllocations: "/api/wishocracy/average-allocations",
    sync: "/api/wishocracy/sync",
  },
  auth: {
    postSignin: "/api/auth/post-signin",
  },
  referralInvitations: {
    root: "/api/referral-invitations",
  },
  profile: {
    root: "/api/profile",
    checkIn: "/api/profile/check-in",
  },
  tasks: {
    root: "/api/tasks",
    claim: (id: string) => `/api/tasks/${id}/claim`,
    communications: (id: string) => `/api/tasks/${id}/communications`,
    complete: (id: string) => `/api/tasks/${id}/complete`,
    comments: (id: string, query?: string) =>
      `/api/tasks/${id}/comments${query ? `?${query}` : ""}`,
    comment: (id: string) => `/api/tasks/comments/${id}`,
    commentVote: (id: string) => `/api/tasks/comments/${id}/vote`,
    verify: (id: string) => `/api/tasks/${id}/verify`,
    reassign: (id: string) => `/api/tasks/${id}/reassign`,
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
  voice: {
    token: "/api/voice/token",
    rag: "/api/voice/rag",
  },
} as const;
