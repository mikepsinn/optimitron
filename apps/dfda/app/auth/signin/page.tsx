"use client"

import { useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { AuthForm } from "@/components/auth/AuthForm"
import { ROUTES } from "@/lib/routes"

export default function SignInPage() {
  const searchParams = useSearchParams()
  // apps/dfda has no /dashboard route yet; fall back to the homepage instead
  // of a 404.
  const callbackUrl = searchParams?.get("callbackUrl") || ROUTES.home

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-beige">
        <div className="w-full max-w-md">
          <AuthForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </Layout>
  )
}
