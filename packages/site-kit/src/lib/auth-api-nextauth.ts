import NextAuth from "next-auth"
import { authOptions } from "./auth"

const handler = NextAuth(authOptions)

/** Shared NextAuth App Router handlers. */
export { handler as GET, handler as POST }
