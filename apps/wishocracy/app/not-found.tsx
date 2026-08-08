import Link from "next/link"
import { Layout } from "@/components/layout"
import { Sentry404Reporter } from "@/components/sentry-404-reporter"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <Layout>
      <Sentry404Reporter />
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-beige">
        <div className="w-full max-w-2xl">
          <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-6xl md:text-8xl font-black mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-4">
              PAGE NOT <span className="text-brutal-pink">FOUND</span>
            </h2>

            <div className="bg-brutal-cyan border-4 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl font-black mb-2">🔍 LOST IN CYBERSPACE?</p>
              <p className="font-bold">
                This page is either hiding, taking a nap, or never existed in the first place.
              </p>
            </div>

            <p className="text-lg mb-6 leading-relaxed">
              Maybe you typed the wrong URL? Or maybe our intern deleted it? 🤔
              <br />
              Either way, let's get you back to safety.
            </p>

            <div className="bg-brutal-yellow border-4 border-black p-4 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-black text-sm">💡 PRO TIP:</p>
              <p className="text-sm font-bold">
                If you're looking for the cure to a disease, try our homepage. We're working on curing 404 errors too!
              </p>
            </div>

            <Link href="/">
              <Button className="h-14 text-lg font-black uppercase bg-brutal-pink text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all w-full md:w-auto">
                TAKE ME HOME
              </Button>
            </Link>

            <p className="mt-6 text-sm text-gray-600 italic">
              P.S. No pages were harmed in the making of this error message.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
