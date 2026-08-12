import { getProfileData } from "../actions"
import { ProfileEditClient } from "./profile-edit-client"

export default async function ProfileEditPage() {
  const data = await getProfileData()

  return <ProfileEditClient initialData={data} />
}
