import { Suspense } from "react"
import AuthErrorContent from "./error-content"
import { AlertCircle } from "lucide-react"

// Loading fallback component
function ErrorLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] p-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 border-4 border-black">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-4xl font-black mb-2">Loading...</h1>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<ErrorLoading />}>
      <AuthErrorContent />
    </Suspense>
  )
}
