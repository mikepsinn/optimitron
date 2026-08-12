import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      referralCode?: string
      /** Canonical public identifier from Person.handle */
      handle?: string | null
      /** @deprecated Prefer `handle`. Alias for gradual UI migration. */
      username?: string | null
      isPublic?: boolean
      isAdmin?: boolean
      personId?: string | null
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    referralCode?: string
    handle?: string | null
    /** @deprecated Prefer `handle` */
    username?: string | null
    isPublic?: boolean
    isAdmin?: boolean
    personId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    personId?: string | null
    referralCode?: string
    handle?: string | null
    isPublic?: boolean
    isAdmin?: boolean
  }
}
