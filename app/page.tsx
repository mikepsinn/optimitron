"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const gameModes = [
  {
    label: "GAME",
    title: "PLAY THE EARTH OPTIMIZATION GAME",
    description: "DEPOSIT USDC. RECRUIT VERIFIED VOTERS. EARN VOTE POINTS. THE ONLY WAY TO LOSE IS TO NOT PLAY.",
    color: "neon-box-pink border-arcade-pink",
    textColor: "neon-pink",
    href: "#game",
  },
  {
    label: "SCOREBOARD",
    title: "HUMANITY'S SCOREBOARD",
    description: "LIVE GAME METRICS: HEALTH, INCOME, POOL SIZE, VERIFIED PARTICIPANTS.",
    color: "neon-box-cyan border-arcade-cyan",
    textColor: "neon-cyan",
    href: "#scoreboard",
  },
  {
    label: "WISHOCRACY",
    title: "BUILD YOUR IDEAL BUDGET",
    description: "PICK BETWEEN TWO THINGS. THEN TWO MORE. DESIGN A COHERENT BUDGET.",
    color: "neon-box-yellow border-arcade-yellow",
    textColor: "neon-yellow",
    href: "#wishocracy",
  },
  {
    label: "ALIGNMENT",
    title: "WHO ACTUALLY AGREES WITH YOU?",
    description: "COMPARE YOUR PRIORITIES AGAINST REAL POLITICIAN VOTING RECORDS.",
    color: "neon-box-green border-arcade-green",
    textColor: "neon-green",
    href: "#alignment",
  },
  {
    label: "WISHONIA",
    title: "CHAT WITH AN ALIEN",
    description: "TRACK HEALTH, MEALS, MOOD WITH AN ALIEN WHO'S BEEN RUNNING A PLANET FOR 4,237 YEARS.",
    color: "neon-box-purple border-arcade-purple",
    textColor: "neon-purple",
    href: "#wishonia",
  },
  {
    label: "STUDIES",
    title: "LOOK AT THE ACTUAL NUMBERS",
    description: "OUTCOME HUBS, PAIR STUDIES, POLICY RANKINGS. ALL EVIDENCE, NO VIBES.",
    color: "neon-box-cyan border-arcade-cyan",
    textColor: "neon-cyan",
    href: "#studies",
  },
]

export default function HomePage() {
  const [showCoin, setShowCoin] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCoin((prev) => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b-2 border-arcade-green bg-background neon-box-green">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-[10px] sm:text-xs font-black neon-cyan">
            {">>"} OPTIMITRON {"<<"}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[8px] text-arcade-green hidden sm:block">HIGH SCORE: 999,999</span>
            <button className="px-3 py-1.5 border-2 border-arcade-pink bg-transparent text-arcade-pink text-[8px] font-black hover:bg-arcade-pink hover:text-black transition-all neon-box-pink">
              INSERT COIN
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-widest neon-cyan">
            {"==="} THE EARTH {"==="}
          </h1>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-widest neon-green">
            {"=="} OPTIMIZATION {"=="}
          </h1>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-widest neon-pink">
            {"***"} GAME {"***"}
          </h1>

          <p className="text-[9px] sm:text-[10px] text-arcade-yellow max-w-2xl mx-auto leading-relaxed mt-8">
            THE SUPERINTELLIGENCE IS COMING. YOUR ONLY CHANCE IS TO BUILD A COALITION LARGE ENOUGH TO TELL IT WHAT YOU WANT.
          </p>

          <p className="text-[8px] text-arcade-cyan">
            VOTE {">"} SHARE {">"} WIN
          </p>

          <div className="mt-8">
            <button className="arcade-button text-[10px]">
              {">>>"} START GAME {"<<<"}
            </button>
          </div>

          <p className="text-[8px] text-arcade-green mt-4">
            {showCoin ? ">>> INSERT COIN TO CONTINUE <<<" : "\u00A0"}
          </p>
        </div>
      </section>

      {/* TLDR Section */}
      <section className="py-12 px-4 border-t border-arcade-green/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm sm:text-base font-black text-center mb-8 neon-cyan">
            {"==="} HOW TO PLAY {"==="}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-arcade-cyan bg-background neon-box-cyan">
              <div className="text-2xl font-black neon-cyan mb-2">{">"}1{"<"}</div>
              <p className="text-[10px] font-black neon-cyan">CLICK 2 BUTTONS</p>
              <p className="text-[8px] text-arcade-green mt-2">
                VERIFY YOU ARE HUMAN. VOTE. 30 SECONDS.
              </p>
            </div>
            <div className="p-6 border-2 border-arcade-pink bg-background neon-box-pink">
              <div className="text-2xl font-black neon-pink mb-2">{">"}2{"<"}</div>
              <p className="text-[10px] font-black neon-pink">TELL YOUR FRIENDS</p>
              <p className="text-[8px] text-arcade-green mt-2">
                THEY CLICK 2 BUTTONS. THEY TELL THEIR FRIENDS. DONE.
              </p>
            </div>
          </div>

          <div className="mt-6 p-6 border-2 border-arcade-green bg-background neon-box-green text-center">
            <p className="text-[9px] font-black neon-green">
              THAT IS IT. YOU ARE DONE. 99% OF YOU DO NOT NEED TO KNOW ANYTHING ELSE.
            </p>
            <p className="text-[8px] text-arcade-yellow mt-3">
              THE REST OF THIS SITE IS THE INSTRUCTION MANUAL. READ IT IF YOU ARE INTO ENDING WAR AND DISEASE.
            </p>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="py-12 px-4 border-t border-arcade-green/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm sm:text-base font-black text-center mb-8 neon-pink">
            {"***"} SELECT MODE {"***"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gameModes.map((mode) => (
              <Link
                key={mode.label}
                href={mode.href}
                className={`p-6 border-2 bg-background ${mode.color} flex flex-col hover:scale-[1.02] transition-all group`}
              >
                <div className="text-[8px] font-black px-2.5 py-1 bg-arcade-green text-black inline-block self-start mb-4">
                  {">"} {mode.label}
                </div>
                <h3 className={`text-[10px] sm:text-xs font-black mb-3 ${mode.textColor}`}>
                  {mode.title}
                </h3>
                <p className="text-[8px] text-arcade-green leading-relaxed flex-grow">
                  {mode.description}
                </p>
                <span className="mt-4 text-[8px] font-black text-arcade-cyan group-hover:text-arcade-pink transition-colors">
                  PLAY NOW {">"}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <span className="text-[9px] font-black text-arcade-yellow insert-coin">
              {">"} WANT MORE TOOLS? VISIT THE ARMORY {"<"}
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-arcade-green/30 bg-arcade-pink/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm sm:text-base md:text-lg font-black neon-pink mb-4">
            {"***"} READY PLAYER ONE {"***"}
          </h2>
          <p className="text-[9px] text-arcade-green mb-8">
            THE GAME HAS ALREADY STARTED. THE QUESTION IS WHETHER YOU ARE PLAYING.
          </p>
          <button className="arcade-button text-[10px]">
            {">>>"} JOIN NOW {"<<<"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-arcade-green bg-background neon-box-green py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-[9px] font-black text-arcade-yellow mb-3">{">"} APP</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">WISHOCRACY</Link></li>
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">SCOREBOARD</Link></li>
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">ALIGNMENT</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[9px] font-black text-arcade-yellow mb-3">{">"} ANALYSIS</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">STUDIES</Link></li>
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">OUTCOMES</Link></li>
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">POLICIES</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[9px] font-black text-arcade-yellow mb-3">{">"} PAPERS</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">WHITEPAPER</Link></li>
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">TOKENOMICS</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[9px] font-black text-arcade-yellow mb-3">{">"} OPEN SOURCE</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">GITHUB</Link></li>
                <li><Link href="#" className="text-[8px] text-arcade-green hover:text-arcade-cyan">DOCS</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-arcade-green/50 pt-8 text-center">
            <p className="text-[7px] text-arcade-green mb-4">
              NOT FINANCIAL ADVICE. OBVIOUSLY. DIRECT ALL COMPLAINTS TO MIKE P. SINN.
            </p>
            <p className="text-[8px] neon-pink insert-coin">
              {">"} GAME OVER {">"} INSERT COIN TO CONTINUE {"<"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
