export const USERNAME_MIN_LENGTH = 1
export const USERNAME_MAX_LENGTH = 24
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

export function sanitizeUsernameInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "")
}

export function validateUsername(handle: string): string | null {
  if (handle.length < USERNAME_MIN_LENGTH || handle.length > USERNAME_MAX_LENGTH) {
    return `Handle must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`
  }

  if (!USERNAME_PATTERN.test(handle)) {
    return "Handle can only include letters, numbers, and underscores."
  }

  return null
}

export function getUsernameLengthHelpText(): string {
  return `${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters. Letters, numbers, and underscores only.`
}
