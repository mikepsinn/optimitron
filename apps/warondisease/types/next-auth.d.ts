import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      referralCode?: string
      username?: string | null
      isPublic?: boolean
      isAdmin?: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    referralCode?: string
    username?: string | null
    isPublic?: boolean
    isAdmin?: boolean
  }
}
