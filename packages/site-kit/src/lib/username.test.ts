import { describe, expect, it } from "vitest"

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  getUsernameLengthHelpText,
  sanitizeUsernameInput,
  validateUsername,
} from "./username"

describe("username helpers", () => {
  it("allows a single-character username", () => {
    expect(validateUsername("m")).toBeNull()
  })

  it("rejects usernames longer than the max", () => {
    expect(validateUsername("a".repeat(USERNAME_MAX_LENGTH + 1))).toBe(
      `Handle must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`
    )
  })

  it("rejects invalid characters", () => {
    expect(validateUsername("a-b")).toBe(
      "Handle can only include letters, numbers, and underscores."
    )
  })

  it("sanitizes invalid characters from input", () => {
    expect(sanitizeUsernameInput("a-b.c!")).toBe("abc")
  })

  it("returns help text that matches the current limits", () => {
    expect(getUsernameLengthHelpText()).toBe(
      `${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters. Letters, numbers, and underscores only.`
    )
  })
})
