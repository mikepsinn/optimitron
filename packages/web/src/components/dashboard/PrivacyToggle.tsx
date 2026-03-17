"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PrivacyToggleProps {
  isPublic: boolean
  onChange: (isPublic: boolean) => void
}

export function PrivacyToggle({ isPublic, onChange }: PrivacyToggleProps) {
  return (
    <div className="w-full">
      <div
        className="relative flex h-16 w-full cursor-pointer items-center justify-between border-2 border-black bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        onClick={() => onChange(!isPublic)}
      >
        {/* Sliding Background */}
        <motion.div
          className={cn(
            "absolute h-[calc(100%-8px)] w-[calc(50%-4px)] border-2 border-black",
            isPublic ? "bg-brutal-yellow" : "bg-muted-foreground/20"
          )}
          initial={false}
          animate={{
            x: isPublic ? "100%" : "0%",
            marginLeft: isPublic ? "4px" : "0px",
            marginRight: isPublic ? "0px" : "4px"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        {/* Private Option (Left) */}
        <div className="relative z-10 flex w-1/2 items-center justify-center gap-2">
          <span className="text-xl">🔒</span>
          <span className={cn("font-black tracking-tight transition-colors", !isPublic ? "text-black" : "text-muted-foreground")}>
            PRIVATE
          </span>
        </div>

        {/* Public Option (Right) */}
        <div className="relative z-10 flex w-1/2 items-center justify-center gap-2">
          <span className="text-xl">🌍</span>
          <span className={cn("font-black tracking-tight transition-colors", isPublic ? "text-black" : "text-muted-foreground")}>
            PUBLIC
          </span>
        </div>
      </div>

      {/* Description Text */}
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
