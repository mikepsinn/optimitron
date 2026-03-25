"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const gameModes = [
  {
    label: "GAME",
    title: "PLAY THE EARTH OPTIMIZATION GAME",
    description: "DEPOSIT USDC. RECRUIT VERIFIED VOTERS. EARN VOTE POINTS.",
    bgColor: "bg-red",
    href: "#game",
  },
  {
    label: "SCOREBOARD",
    title: "HUMANITY'S SCOREBOARD",
    description: "LIVE GAME METRICS: HEALTH, INCOME, POOL SIZE.",
    bgColor: "bg-blue",
    href: "#scoreboard",
  },
  {
    label: "WISHOCRACY",
    title: "BUILD YOUR IDEAL BUDGET",
    description: "PICK BETWEEN TWO THINGS. DESIGN A COHERENT BUDGET.",
    bgColor: "bg-green",
    href: "#wishocracy",
  },
  {
    label: "ALIGNMENT",
    title: "WHO AGREES WITH YOU?",
    description: "COMPARE YOUR PRIORITIES AGAINST REAL VOTING RECORDS.",
    bgColor: "bg-cyan",
    href: "#alignment",
  },
  {
    label: "WISHONIA",
    title: "CHAT WITH AN ALIEN",
    description: "TRACK HEALTH AND HABITS WITH AN ALIEN ADVISOR.",
    bgColor: "bg-magenta",
    href: "#wishonia",
  },
  {
    label: "STUDIES",
    title: "LOOK AT THE NUMBERS",
    description: "OUTCOME HUBS, PAIR STUDIES, POLICY RANKINGS.",
    bgColor: "bg-orange",
    href: "#studies",
  },
]

export default function HomePage() {
  const [showText, setShowText] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowText((prev) => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="border-b-4 border-foreground bg-background">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-[8px] sm:text-[10px]">
            * OPTIMITRON *
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[8px] text-gray hidden sm:block">HI-SCORE 999999</span>
            <button className="px-3 py-1 border-4 border-foreground bg-yellow text-black text-[8px]">
              START
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 px-4 text-center border-b-4 border-foreground">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-sm sm:text-base md:text-lg text-cyan">
            THE EARTH
          </h1>
          <h1 className="text-sm sm:text-base md:text-lg text-green">
            OPTIMIZATION
          </h1>
          <h1 className="text-base sm:text-lg md:text-xl text-red">
            GAME
          </h1>

          <p className="text-[8px] text-yellow max-w-xl mx-auto leading-relaxed mt-6">
            THE SUPERINTELLIGENCE IS COMING. BUILD A COALITION LARGE ENOUGH TO TELL IT WHAT YOU WANT.
          </p>

          <div className="mt-6">
            <button className="px-6 py-2 border-4 border-foreground bg-red text-foreground text-[10px] hover:bg-foreground hover:text-background">
              PRESS START
            </button>
          </div>

          <p className="text-[8px] text-yellow mt-4 h-4">
            {showText ? "INSERT COIN" : ""}
          </p>
        </div>
      </section>

      {/* How to Play */}
      <section className="py-10 px-4 border-b-4 border-foreground">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[10px] sm:text-xs text-center mb-6 text-cyan">
            - HOW TO PLAY -
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border-4 border-foreground bg-blue">
              <div className="text-lg text-foreground mb-1">1</div>
              <p className="text-[8px] text-foreground">CLICK 2 BUTTONS</p>
              <p className="text-[7px] text-foreground mt-1 opacity-80">
                VERIFY HUMAN. VOTE. 30 SEC.
              </p>
            </div>
            <div className="p-4 border-4 border-foreground bg-green">
              <div className="text-lg text-foreground mb-1">2</div>
              <p className="text-[8px] text-foreground">TELL FRIENDS</p>
              <p className="text-[7px] text-foreground mt-1 opacity-80">
                THEY CLICK. THEY TELL. DONE.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 border-4 border-foreground bg-yellow text-black text-center">
            <p className="text-[8px]">
              THAT IS IT. 99% DO NOT NEED MORE.
            </p>
          </div>
        </div>
      </section>

      {/* Select Mode */}
      <section className="py-10 px-4 border-b-4 border-foreground">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[10px] sm:text-xs text-center mb-6 text-red">
            - SELECT MODE -
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameModes.map((mode) => (
              <Link
                key={mode.label}
                href={mode.href}
                className={`p-4 border-4 border-foreground ${mode.bgColor} text-foreground flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform`}
              >
                <div className="text-[7px] mb-2 opacity-80">
                  {">"} {mode.label}
                </div>
                <h3 className="text-[8px] mb-2">
                  {mode.title}
                </h3>
                <p className="text-[7px] opacity-80 flex-grow">
                  {mode.description}
                </p>
                <span className="mt-3 text-[7px]">
                  SELECT {">"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-4 border-b-4 border-foreground bg-magenta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[10px] sm:text-xs text-foreground mb-3">
            READY PLAYER ONE
          </h2>
          <p className="text-[8px] text-foreground mb-4 opacity-80">
            THE GAME HAS STARTED. ARE YOU PLAYING?
          </p>
          <button className="px-6 py-2 border-4 border-foreground bg-yellow text-black text-[8px] hover:bg-foreground hover:text-background">
            JOIN NOW
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-foreground bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="text-[8px] text-yellow mb-2">APP</h4>
              <ul className="space-y-1">
                <li><Link href="#" className="text-[7px] text-gray hover:text-foreground">WISHOCRACY</Link></li>
                <li><Link href="#" className="text-[7px] text-gray hover:text-foreground">SCOREBOARD</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[8px] text-yellow mb-2">ANALYSIS</h4>
              <ul className="space-y-1">
                <li><Link href="#" className="text-[7px] text-gray hover:text-foreground">STUDIES</Link></li>
                <li><Link href="#" className="text-[7px] text-gray hover:text-foreground">OUTCOMES</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[8px] text-yellow mb-2">PAPERS</h4>
              <ul className="space-y-1">
                <li><Link href="#" className="text-[7px] text-gray hover:text-foreground">WHITEPAPER</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[8px] text-yellow mb-2">CODE</h4>
              <ul className="space-y-1">
                <li><Link href="#" className="text-[7px] text-gray hover:text-foreground">GITHUB</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t-4 border-foreground pt-4 text-center">
            <p className="text-[7px] text-gray mb-2">
              NOT FINANCIAL ADVICE
            </p>
            <p className="text-[8px] text-red">
              {showText ? "GAME OVER - INSERT COIN" : ""}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
