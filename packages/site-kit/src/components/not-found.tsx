import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import Link from "next/link"

import { Layout } from "./layout"
import { Sentry404Reporter } from "./sentry-404-reporter"

export function NotFoundPage() {
  return (
    <Layout>
      <Sentry404Reporter />
      <main className="flex min-h-screen items-center justify-center bg-brutal-beige px-4 py-12">
        <section className="w-full max-w-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:p-12">
          <p className="mb-4 text-7xl font-black md:text-8xl">404</p>
          <h1 className="mb-4 text-3xl font-black uppercase md:text-4xl">Page not found</h1>
          <p className="mb-8 text-lg leading-relaxed">
            This address may be wrong, or the page may have moved. Return home to continue.
          </p>
          <Button asChild className="h-14 border-4 border-black bg-brutal-pink text-lg font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
            <Link href="/">Go home</Link>
          </Button>
        </section>
      </main>
    </Layout>
  )
}

export default NotFoundPage
