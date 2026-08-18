"use client"

import { Card } from "@/components/retroui/Card"
import { Button } from "@/components/retroui/Button"
import { useTheme } from "@/components/ThemeProvider"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/theme"

const THEMES: Array<{
  value: Theme
  label: string
}> = [
  {
    value: "light",
    label: "Light",
  },
  {
    value: "dark",
    label: "Dark",
  },
]

export function ThemePreferencesCard() {
  const { theme, setTheme } = useTheme()

  return (
    <Card className="border-2 border-foreground bg-background">
      <Card.Content className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-black uppercase text-foreground">
          Theme
        </span>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {THEMES.map((option) => {
            const selected = option.value === theme

            return (
              <Button
                key={option.value}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={selected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "min-h-10 justify-center border-2 border-foreground px-4 text-sm font-black uppercase shadow-none hover:translate-y-0 active:translate-x-0 active:translate-y-0 sm:min-w-24",
                  selected
                    ? "bg-foreground text-background hover:bg-foreground"
                    : "bg-background text-foreground hover:bg-muted",
                )}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </Card.Content>
    </Card>
  )
}
