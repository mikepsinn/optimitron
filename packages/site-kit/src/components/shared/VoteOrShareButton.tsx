"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Share2, Vote, ArrowRight } from "lucide-react"
import { storage } from "../../lib/storage"
import { getUsernameOrReferralCode } from "../../lib/referral.client"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import { getVoteSectionUrl } from "../../lib/voting"

interface VoteOrShareButtonProps {
  variant?: "default" | "hero" | "nav" | "cta" | "inline"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showIcon?: boolean
  forceText?: string // Override auto-detected text
  onClick?: (e: React.MouseEvent) => void // For custom click handlers (e.g., smooth scroll)
}

interface UserVoteStatus {
  hasVoted: boolean
  VotePosition?: "YES" | "NO"
  referralCode?: string
}

/**
 * VoteOrShareButton - An adaptive button that toggles between vote and share functionality:
 * - Not logged in → "Answer the Question" → Links to /#vote (vote section handles pending votes and shows signup inline)
 * - Logged in & not voted → "Answer the Question" → Links to /#vote
 * - Logged in & voted YES → "Eradicate Disease" → Links to /dashboard#referral
 * - Logged in & voted NO → "Eradicate Disease" → Links to /dashboard
 */
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

  // Check vote status on mount and when auth changes
  useEffect(() => {
    const checkVoteStatus = async () => {
      // Only check vote status if user is logged in
      // For non-authenticated users, always send to vote section (which handles pending votes)
      if (status === "authenticated" && session?.user) {
        // Try to get from cache first
        const cachedStatus = storage.getVoteStatusCache()
        const sessionUser = session.user as {
          handle?: string | null
          username?: string | null
          referralCode?: string | null
        }
        const sessionReferralIdentifier =
          getUsernameOrReferralCode(sessionUser) || undefined

        if (cachedStatus) {
          setVoteStatus({
            hasVoted: cachedStatus.hasVoted,
            VotePosition: cachedStatus.VotePosition,
            referralCode: cachedStatus.referralCode || sessionReferralIdentifier,
          })
          return // Use cached data, no API call needed
        }

        // Cache miss - fetch from API
        try {
          const response = await fetch("/api/user/vote-status")
          if (response.ok) {
            const data = await response.json()
            const statusData = {
              hasVoted: data.hasVoted,
              VotePosition: data.VotePosition,
              referralCode: sessionReferralIdentifier,
            }

            // Cache the result
            storage.setVoteStatusCache(statusData)
            setVoteStatus(statusData)
          }
        } catch (error) {
          console.error("Failed to fetch vote status:", error)
        }
      } else {
        // Not authenticated - always send to vote section (don't check pending votes)
        setVoteStatus(null)
      }
    }

    checkVoteStatus()
  }, [session, status])

  // Determine button text based on user state
  const getButtonText = () => {
    if (forceText) return forceText

    // Not logged in - always show "Answer the Question" (vote section handles pending votes)
    if (status !== "authenticated") {
      return "Answer the Question"
    }

    // Logged in states
    if (voteStatus?.hasVoted) {
      return "Eradicate Disease"
    }

    return "Answer the Question"
  }

  // Determine button destination based on user state
  const getButtonHref = () => {
    // Not logged in - always go to vote section (it handles pending votes and shows signup inline)
    if (status !== "authenticated") {
      return getVoteSectionUrl()
    }

    // Logged in and voted - go to dashboard
    if (voteStatus?.hasVoted) {
      return voteStatus.VotePosition === "YES" ? "/dashboard#referral" : "/dashboard"
    }

    // Logged in but haven't voted yet - go to vote section
    return getVoteSectionUrl()
  }

  // Determine icon based on state
  const getIcon = () => {
    if (!showIcon) return null

    // Only show share icon if logged in and voted
    if (status === "authenticated" && voteStatus?.hasVoted) {
      return <Share2 className={cn("w-4 h-4", size === "xl" && "w-6 h-6")} />
    }

    // For all other cases (not logged in, or logged in but not voted), show vote/arrow icon
    return variant === "hero" ?
      <ArrowRight className={cn("w-4 h-4", size === "xl" && "w-6 h-6")} /> :
      <Vote className={cn("w-4 h-4", size === "xl" && "w-6 h-6")} />
  }

  // Size classes mapping
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-base",
    lg: "h-14 px-6 text-lg",
    xl: "h-20 px-8 text-xl sm:text-2xl",
  }

  // Variant classes mapping
  const variantClasses = {
    default: "bg-brutal-cyan hover:bg-brutal-cyan/90 text-foreground",
    hero: "bg-brutal-pink hover:bg-brutal-pink/90 text-brutal-pink-foreground",
    nav: "bg-background hover:bg-background/90",
    cta: "bg-brutal-yellow hover:bg-brutal-yellow/90 text-foreground",
    inline: "bg-transparent hover:bg-brutal-yellow/10 p-0 h-auto",
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

  // Handle click - either custom handler or navigate
  const handleClick = (e: React.MouseEvent) => {
    // If custom onClick provided and it's a hash link on same page
    if (onClick && href.startsWith("/#")) {
      onClick(e)
      return
    }

    // For inline variant, always use router
    if (variant === "inline") {
      e.preventDefault()
      router.push(href)
      return
    }

    // Default behavior for links
  }

  // Inline variant uses button with router.push
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

  // Regular button as Link. Keep responsive width overrides on the wrapper
  // so patterns like `w-full sm:w-auto` behave correctly in flex layouts.
  const linkClassName = cn(
    buttonClassName.includes("w-full") ? "block" : "inline-block",
    buttonClassName.includes("w-full") && "w-full",
    buttonClassName.includes("sm:w-auto") && "sm:w-auto",
    buttonClassName.includes("sm:w-full") && "sm:w-full",
    buttonClassName.includes("md:w-auto") && "md:w-auto",
    buttonClassName.includes("md:w-full") && "md:w-full",
    buttonClassName.includes("lg:w-auto") && "lg:w-auto",
    buttonClassName.includes("lg:w-full") && "lg:w-full"
  )
  
  return (
    <Link href={href} onClick={handleClick} className={linkClassName}>
      <Button className={buttonClassName}>
        {icon}
        {buttonText}
      </Button>
    </Link>
  )
}
