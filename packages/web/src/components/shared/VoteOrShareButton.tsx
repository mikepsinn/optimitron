"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/retroui/Button"
import { Share2, Vote, ArrowRight } from "lucide-react"
import { getHandleOrReferralCode } from "@/lib/referral.client"
import { cn } from "@/lib/utils"
import { DASHBOARD_REFERRAL_HREF, ROUTES } from "@/lib/routes"

interface VoteOrShareButtonProps {
  variant?: "default" | "hero" | "nav" | "cta" | "inline"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showIcon?: boolean
  forceText?: string
  onClick?: (e: React.MouseEvent) => void
}

interface UserVoteStatus {
  hasVoted: boolean
  voteAnswer?: "YES" | "NO"
  referralCode?: string
}

export function VoteOrShareButton({
  variant = "default",
  size = "md",
  className,
  showIcon = true,
  forceText,
  onClick,
}: VoteOrShareButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [voteStatus, setVoteStatus] = useState<UserVoteStatus | null>(null)

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (status === "authenticated" && session?.user) {
        const sessionReferralIdentifier = getHandleOrReferralCode(session.user) || undefined

        try {
          const response = await fetch("/api/referendums")
          if (response.ok) {
            const data = await response.json()
            const hasVoted = Array.isArray(data) && data.some((r: { userVote?: unknown }) => r.userVote)
            setVoteStatus({
              hasVoted,
              referralCode: sessionReferralIdentifier,
            })
          }
        } catch (error) {
          console.error("Failed to fetch vote status:", error)
        }
      } else {
        setVoteStatus(null)
      }
    }

    checkVoteStatus()
  }, [session, status])

  const getButtonText = () => {
    if (forceText) return forceText

    if (status !== "authenticated") {
      return "Vote Now"
    }

    if (voteStatus?.hasVoted) {
      return "Optimize Earth"
    }

    return "Vote Now"
  }

  const getButtonHref = () => {
    if (status !== "authenticated") {
      return ROUTES.wishocracy
    }

    if (voteStatus?.hasVoted) {
      return DASHBOARD_REFERRAL_HREF
    }

    return ROUTES.wishocracy
  }

  const getIcon = () => {
    if (!showIcon) return null

    if (status === "authenticated" && voteStatus?.hasVoted) {
      return <Share2 className={cn("w-4 h-4", size === "xl" && "w-6 h-6")} />
    }

    return variant === "hero" ?
      <ArrowRight className={cn("w-4 h-4", size === "xl" && "w-6 h-6")} /> :
      <Vote className={cn("w-4 h-4", size === "xl" && "w-6 h-6")} />
  }

  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-base",
    lg: "h-14 px-6 text-lg",
    xl: "h-20 px-8 text-xl sm:text-2xl",
  }

  const variantClasses = {
    default: "bg-background hover:bg-background/90 text-foreground",
    hero: "bg-foreground hover:bg-foreground/90 text-background",
    nav: "bg-background hover:bg-background/90",
    cta: "bg-background hover:bg-background/90 text-foreground",
    inline: "bg-transparent hover:bg-background/10 p-0 h-auto",
  }

  const buttonClassName = cn(
    "font-black uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    "hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    "transition-all flex items-center justify-center gap-2",
    sizeClasses[size],
    variantClasses[variant],
    variant === "inline" && "shadow-none border-0 hover:shadow-none",
    className
  )

  const href = getButtonHref()
  const buttonText = getButtonText()
  const icon = getIcon()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick && href.startsWith("/#")) {
      onClick(e)
      return
    }

    if (variant === "inline") {
      e.preventDefault()
      router.push(href)
      return
    }
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        className={buttonClassName}
      >
        {icon}
        {buttonText}
      </button>
    )
  }

  const linkClassName = buttonClassName.includes("w-full") ? "block w-full" : "inline-block"

  return (
    <Link href={href} onClick={handleClick} className={linkClassName}>
      <Button className={buttonClassName}>
        {icon}
        {buttonText}
      </Button>
    </Link>
  )
}
