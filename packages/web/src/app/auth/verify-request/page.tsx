export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-neutral-950">
      <div className="w-full max-w-md border border-neutral-950 bg-white p-8 shadow-none">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Check Your Inbox
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Magic Link Sent</h1>
        <p className="mt-4 text-sm leading-6 text-neutral-600">
          Open the email we just sent you and click the sign-in link. If it does not arrive within
          a minute, check spam and then try again.
        </p>
      </div>
    </main>
  );
}
