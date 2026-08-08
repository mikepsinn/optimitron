"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface BecomePartnerCTAProps {
  variant?: "default" | "large" | "inline"
  className?: string
}

export function BecomePartnerCTA({ variant = "default", className = "" }: BecomePartnerCTAProps) {
  const scrollToRegister = () => {
    const registerSection = document.querySelector('[data-register-section]')
    registerSection?.scrollIntoView({ behavior: 'smooth' })
  }

  if (variant === "large") {
    return (
      <div className={`text-center ${className}`}>
        <Button
          onClick={scrollToRegister}
          size="lg"
          className="bg-brutal-pink text-foreground border-4 border-primary hover:bg-brutal-yellow font-black uppercase text-xl px-12 py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          BECOME A PARTNER INSTITUTE
          <ArrowRight className="ml-3 h-6 w-6" />
        </Button>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <Button
        onClick={scrollToRegister}
        className={`bg-foreground text-background border-4 border-primary hover:bg-brutal-pink hover:text-foreground font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all ${className}`}
      >
        GET STARTED
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <Button
        onClick={scrollToRegister}
        size="lg"
        className="bg-foreground text-background border-4 border-primary hover:bg-brutal-pink hover:text-foreground font-black uppercase text-lg px-10 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        BECOME A PARTNER NOW
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  )
}
