function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function insertGeneratedReferralInviteUrl(
  messageText: string,
  inviteUrl: string,
  options: { draftReferralUrl?: string | null } = {},
): string {
  const text = messageText.trim();
  if (!text) return inviteUrl;
  if (text.includes(inviteUrl)) return text;

  const draftReferralUrl = options.draftReferralUrl?.trim();
  let withGeneratedLink = text;
  if (draftReferralUrl && draftReferralUrl !== inviteUrl) {
    const draftPattern = new RegExp(escapeRegex(draftReferralUrl), "g");
    withGeneratedLink = withGeneratedLink.replace(draftPattern, () => inviteUrl);
  }

  if (withGeneratedLink.includes(inviteUrl)) return withGeneratedLink;

  const legacyDraftUrlPattern =
    /https?:\/\/warondisease\.org(?:\/[^\s<>"']*)?|warondisease\.org(?:\/[^\s<>"']*)?/g;
  withGeneratedLink = withGeneratedLink.replace(legacyDraftUrlPattern, () => inviteUrl);

  return withGeneratedLink.includes(inviteUrl)
    ? withGeneratedLink
    : `${withGeneratedLink}\n\n${inviteUrl}`;
}
