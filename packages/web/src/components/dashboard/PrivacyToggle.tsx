"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PrivacyToggleProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
  disabled?: boolean
}

export function PrivacyToggle({
  disabled = false,
  isPublic,
  onChange,
}: PrivacyToggleProps) {
  return (
    <div className="w-full">
      <button
        aria-pressed={isPublic}
        className="relative flex h-14 w-full cursor-pointer items-center justify-between border-2 border-foreground bg-background p-1 text-foreground transition-colors disabled:cursor-wait disabled:opacity-60"
        disabled={disabled}
        onClick={() => onChange(!isPublic)}
        type="button"
      >
        <motion.div
          className={cn(
            "absolute h-[calc(100%-8px)] w-[calc(50%-4px)] border border-foreground",
            isPublic ? "bg-foreground" : "bg-muted",
          )}
          initial={false}
          animate={{
            x: isPublic ? "100%" : "0%",
            marginLeft: isPublic ? "4px" : "0px",
            marginRight: isPublic ? "0px" : "4px"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <div className="relative z-10 flex w-1/2 items-center justify-center gap-2">
          <span aria-hidden className="text-lg">🔒</span>
          <span className={cn("font-black tracking-tight transition-colors", !isPublic ? "text-foreground" : "text-muted-foreground")}>
            PRIVATE
          </span>
        </div>

        <div className="relative z-10 flex w-1/2 items-center justify-center gap-2">
          <span aria-hidden className="text-lg">🌍</span>
          <span className={cn("font-black tracking-tight transition-colors", isPublic ? "text-background" : "text-muted-foreground")}>
            PUBLIC
          </span>
        </div>
      </button>

      <div className="mt-4 min-h-[40px] text-center">
        {isPublic ? (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            key="public-desc"
            className="text-sm font-bold text-foreground"
          >
            Everyone can see your profile and you appear on leaderboards.
          </motion.p>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            key="private-desc"
            className="text-sm font-bold text-muted-foreground"
          >
            Your profile is hidden. Comparisons and allocations are private.
          </motion.p>
        )}
      </div>
    </div>
  )
}
