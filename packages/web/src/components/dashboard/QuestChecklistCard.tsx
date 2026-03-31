"use client"

import Link from "next/link"
import { Card } from "@/components/retroui/Card"
import { ListChecks, CheckCircle2, Circle, Lock } from "lucide-react"
import type { QuestItem } from "@/types/dashboard"

interface QuestChecklistCardProps {
  quests: QuestItem[]
}

export function QuestChecklistCard({ quests }: QuestChecklistCardProps) {
  const completedCount = quests.filter((q) => q.completed).length
  const totalCount = quests.length
  const progressPct = (completedCount / totalCount) * 100

  return (
    <Card className="border-4 border-primary mb-8 bg-background">
      <Card.Header>
        <Card.Title className="text-2xl font-black uppercase flex items-center gap-2">
          <ListChecks className="h-6 w-6" />
          QUEST LOG
        </Card.Title>
        <Card.Description className="text-foreground font-bold">
          {completedCount}/{totalCount} QUESTS COMPLETED
          {completedCount === totalCount
            ? " — You've done everything. Extraordinary."
            : completedCount === 0
              ? " — Start anywhere. Every action earns Wishes."
              : ` — ${totalCount - completedCount} left. Keep going.`}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="h-6 bg-background border-4 border-primary rounded-none overflow-hidden">
            <div
              className="h-full bg-brutal-cyan transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Quest items */}
          <div className="space-y-2">
            {quests.map((quest) => (
              <QuestRow key={quest.reason} quest={quest} />
            ))}
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

function QuestRow({ quest }: { quest: QuestItem }) {
  const content = (
    <div
      className={`flex items-center gap-3 p-3 border-4 border-primary transition-all ${
        quest.completed
          ? "bg-brutal-cyan text-brutal-cyan-foreground"
          : quest.comingSoon
            ? "bg-background opacity-50"
            : "bg-background hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      }`}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {quest.completed ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : quest.comingSoon ? (
          <Lock className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>

      {/* Emoji */}
      <span className="text-lg flex-shrink-0">{quest.emoji}</span>

      {/* Label */}
      <span
        className={`font-bold flex-grow ${quest.completed ? "line-through" : ""}`}
      >
        {quest.label}
      </span>

      {/* Wishes badge */}
      {quest.comingSoon ? (
        <span className="text-xs font-black bg-muted border-2 border-primary px-2 py-0.5 flex-shrink-0">
          SOON
        </span>
      ) : (
        <span className="text-xs font-black bg-brutal-yellow text-brutal-yellow-foreground border-2 border-primary px-2 py-0.5 flex-shrink-0">
          +{quest.wishesLabel} ★
        </span>
      )}
    </div>
  )

  if (quest.completed || quest.comingSoon) {
    return content
  }

  if (quest.anchor) {
    return <a href={quest.anchor}>{content}</a>
  }

  if (quest.href) {
    return <Link href={quest.href}>{content}</Link>
  }

  return content
}
