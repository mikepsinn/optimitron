import { nanoid } from "nanoid"

export const REFERRAL_INVITE_TOKEN_LENGTH = 16
export const MAX_REFERRAL_INVITATIONS_PER_REQUEST = 10
export const MAX_REFERRAL_INVITATION_EMAILS_PER_DAY = 25
export const MAX_INVITEE_NAME_LENGTH = 120
export const MAX_INVITEE_CONTACT_LENGTH = 200
export const MAX_INVITATION_MESSAGE_LENGTH = 800

export function createReferralInviteToken(): string {
  return nanoid(REFERRAL_INVITE_TOKEN_LENGTH)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim()
}

export function isValidInviteEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function buildDefaultReferralInvitationMessage(recipientName: string, referralUrl: string): string {
  const firstName = getFirstName(recipientName) || "there"
  return `Hi ${firstName}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war on disease? ${referralUrl}`
}
