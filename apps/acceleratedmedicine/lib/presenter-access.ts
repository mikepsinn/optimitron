import { getCurrentUser } from "@/lib/auth-utils"

/** Whether this viewer gets the presentation's speaker notes, which hold the in-person ask to legislators. */
export async function canSeeSpeakerNotes() {
  const user = await getCurrentUser()
  return user?.isAdmin === true
}
