import { Suspense } from "react"
import AuthErrorContent from "./SurveyAuthErrorContent"
import { Layout } from "../layout"

export default function AuthErrorPage() {
  return (
    <Layout>
      <div className="flex min-h-screen items-center justify-center bg-brutal-beige px-4 py-12">
        <div className="w-full max-w-md space-y-6 border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Suspense fallback={<p className="text-lg font-bold" role="status">Loading...</p>}>
            <AuthErrorContent />
          </Suspense>
        </div>
      </div>
    </Layout>
  )
}
