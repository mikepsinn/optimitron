import { ROUTES } from '@/lib/routes'

export default function VerifyRequest() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brutal-beige p-4">
      <div className="w-full max-w-md space-y-8 border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-2">Check your email</h1>
          <div className="mx-auto my-6 h-1 w-20 bg-black"></div>
          <p className="text-lg">
            A verification link has been sent to your email address.
          </p>
        </div>

        <div className="space-y-4 text-center">
          <div className="border-4 border-black bg-brutal-yellow p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold mb-2">Check your inbox</p>
            <p className="text-sm">
              Click the link in the email to verify your vote. The link will expire in 24 hours.
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p>Didn't receive an email?</p>
            <p>Check your spam folder or request another verification link.</p>
          </div>

          <a
            href={ROUTES.home}
            className="inline-block mt-4 border-4 border-black bg-black px-6 py-3 font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Back to Vote
          </a>
        </div>
      </div>
    </div>
  )
}
