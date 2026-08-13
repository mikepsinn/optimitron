"use client"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Mail } from "lucide-react"
import { FaXTwitter, FaFacebook, FaLinkedin, FaRedditAlien, FaTelegram, FaWhatsapp } from "react-icons/fa6"
import { cn } from "@optimitron/neobrutalist-ui/cn"
import { SHARE_TEXT } from "../../lib/constants"
import { trackShare } from "../../lib/analytics"

interface SocialShareButtonsProps {
  url: string
  text?: string
  hashtags?: string
  className?: string
  contentType?: string
  trailingAction?: React.ReactNode
}

export function SocialShareButtons({
  url,
  text = "",
  hashtags = "",
  className,
  contentType = "referral_link",
  trailingAction,
}: SocialShareButtonsProps) {
  const logShareIntent = async (platform: string) => {
    try {
      await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })
    } catch (error) {
      console.error("Failed to log share intent:", error)
    }
  }

  const handleShare = (platform: string) => {
    // Use provided text or fall back to default
    const shareText = text || SHARE_TEXT.DEFAULT
    const shareHashtags = hashtags || SHARE_TEXT.HASHTAGS
    
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(shareText)
    
    // Create email-friendly text with URL included
    // Email subjects should be short (50-60 chars max for best display)
    const emailSubject = shareText.length > 60 
      ? shareText.substring(0, 57) + "..." 
      : shareText || SHARE_TEXT.EMAIL_SUBJECT
    const emailBody = shareText 
      ? `${shareText}\n\n${url}` 
      : SHARE_TEXT.EMAIL_BODY_FALLBACK(url)
    const encodedEmailBody = encodeURIComponent(emailBody)

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}${shareHashtags ? `&hashtags=${encodeURIComponent(shareHashtags)}` : ""}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}${shareText ? `&quote=${encodedText}` : ""}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText ? `${shareText}\n\n${url}` : url)}`,
      email: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodedEmailBody}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    }

    if (shareUrls[platform]) {
      logShareIntent(platform)
      trackShare({
        method: platform,
        contentType,
      })
      window.open(shareUrls[platform], "_blank")
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-bold uppercase">Step 3. Paste on:</p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleShare("twitter")}
          className="border-2 border-primary bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
        >
          {FaXTwitter({ className: "h-4 w-4 mr-2" })}
          Twitter
        </Button>
        <Button
          onClick={() => handleShare("facebook")}
          className="border-2 border-primary bg-[#4267B2] hover:bg-[#4267B2]/90 text-white"
        >
          {FaFacebook({ className: "h-4 w-4 mr-2" })}
          Facebook
        </Button>
        <Button
          onClick={() => handleShare("linkedin")}
          className="border-2 border-primary bg-[#0077B5] hover:bg-[#0077B5]/90 text-white"
        >
          {FaLinkedin({ className: "h-4 w-4 mr-2" })}
          LinkedIn
        </Button>
        <Button
          onClick={() => handleShare("whatsapp")}
          className="border-2 border-primary bg-[#25D366] hover:bg-[#25D366]/90 text-white"
        >
          {FaWhatsapp({ className: "h-4 w-4 mr-2" })}
          WhatsApp
        </Button>
        <Button
          onClick={() => handleShare("telegram")}
          className="border-2 border-primary bg-[#229ED9] hover:bg-[#229ED9]/90 text-white"
        >
          {FaTelegram({ className: "h-4 w-4 mr-2" })}
          Telegram
        </Button>
        <Button
          onClick={() => handleShare("email")}
          className="border-2 border-primary bg-brutal-yellow hover:bg-brutal-yellow/90 text-foreground"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button
          onClick={() => handleShare("reddit")}
          className="border-2 border-primary bg-[#FF4500] hover:bg-[#FF4500]/90 text-white"
        >
          {FaRedditAlien({ className: "h-4 w-4 mr-2" })}
          Reddit
        </Button>
        {trailingAction}
      </div>
    </div>
  )
}
