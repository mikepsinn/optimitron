import { prisma } from "./prisma"
import { ensurePersonForUser } from "./person.server"

const MAX_SIGNATURE_NAME_LENGTH = 120

function cleanSignatureName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const cleaned = value.trim().replace(/\s+/g, " ")
  return cleaned ? cleaned.slice(0, MAX_SIGNATURE_NAME_LENGTH) : null
}

/**
 * The treaty signature box sends the signer's typed name (and optional
 * structured first/middle/last legal name) with the vote. Person owns the
 * public-profile and display-name fields used by signer lists; the vote
 * keeps its own public flag so users can hide a specific signature without
 * changing old private votes into public signatories.
 *
 * No-ops when the payload carries no signature fields, so plain YES/NO
 * votes from the slider flow never touch the Person row.
 */
export async function applySignatureProfile(
  userId: string,
  body: {
    displayName?: unknown
    firstName?: unknown
    middleName?: unknown
    lastName?: unknown
    makePublic?: unknown
  },
) {
  const displayName = cleanSignatureName(body.displayName)
  const firstName = cleanSignatureName(body.firstName)
  const middleName = cleanSignatureName(body.middleName)
  const lastName = cleanSignatureName(body.lastName)
  const makePublic =
    typeof body.makePublic === "boolean" ? body.makePublic : null

  if (
    !displayName &&
    !firstName &&
    !middleName &&
    !lastName &&
    makePublic === null
  ) {
    return
  }

  const person = await ensurePersonForUser(userId)
  const data: {
    displayName?: string
    firstName?: string
    middleName?: string
    lastName?: string
    isPublic?: boolean
  } = {}
  if (displayName && displayName !== person.displayName) {
    data.displayName = displayName
  }
  if (firstName && firstName !== person.firstName) data.firstName = firstName
  if (middleName && middleName !== person.middleName) {
    data.middleName = middleName
  }
  if (lastName && lastName !== person.lastName) data.lastName = lastName
  if (makePublic !== null && person.isPublic !== makePublic) {
    data.isPublic = makePublic
  }

  if (Object.keys(data).length > 0) {
    await prisma.person.update({
      where: { id: person.id },
      data,
    })
  }
}
