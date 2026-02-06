export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://optomitron.com';
}

export function buildUserReferralUrl(user: any, baseUrl: string): string {
  const username = user?.username || user?.id || 'anonymous';
  return `${baseUrl}?ref=${username}`;
}
