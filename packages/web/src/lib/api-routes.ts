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
    attachmentPresign: (id: string) => `/api/tasks/${id}/attachments/presign`,
    attachment: (id: string) => `/api/tasks/attachments/${id}`,
    comment: (id: string) => `/api/tasks/comments/${id}`,
    commentVote: (id: string) => `/api/tasks/comments/${id}/vote`,
    verify: (id: string) => `/api/tasks/${id}/verify`,
    reassign: (id: string) => `/api/tasks/${id}/reassign`,
    applications: (id: string) => `/api/tasks/${id}/applications`,
    application: (id: string, applicationId: string) =>
      `/api/tasks/${id}/applications/${applicationId}`,
    documentReviews: (taskId: string) =>
      `/api/tasks/${taskId}/document-reviews`,
    documentReviewResponse: (reviewTaskId: string) =>
      `/api/tasks/${reviewTaskId}/document-reviews/response`,
    documentReviewProposal: (authorityTaskId: string) =>
      `/api/tasks/${authorityTaskId}/document-reviews/proposal`,
    documentReviewDecision: (authorityTaskId: string) =>
      `/api/tasks/${authorityTaskId}/document-reviews/decision`,
  },
  documents: {
    root: "/api/documents",
    document: (id: string) => `/api/documents/${id}`,
  },
  collections: {
    root: "/api/collections",
    collection: (id: string) => `/api/collections/${id}`,
    records: (id: string) => `/api/collections/${id}/records`,
    recordBatch: (id: string) => `/api/collections/${id}/records/batch`,
    record: (id: string, recordId: string) =>
      `/api/collections/${id}/records/${recordId}`,
    views: (id: string) => `/api/collections/${id}/views`,
  },
  content: {
    access: "/api/content/access",
    export: "/api/content/export",
    attachments: "/api/content/attachments",
    attachment: (id: string) => `/api/content/attachments/${id}`,
    completeAttachment: (id: string) =>
      `/api/content/attachments/${id}/complete`,
    notionImport: "/api/content/imports/notion",
    search: "/api/content/search",
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
