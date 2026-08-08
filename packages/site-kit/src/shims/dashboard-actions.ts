/** Shim for package typecheck; real module lives in each app. */
export async function updateUserProfile(_data: {
  name?: string
  username?: string | null
}): Promise<{ success: boolean }> {
  return { success: true }
}
