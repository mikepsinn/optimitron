import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  /** HTML id for the input - used to connect label */
  htmlFor?: string
}

export function FormField({
  label,
  error,
  required = false,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-bold uppercase block">
        {label}
        {required && " *"}
      </Label>
      {children}
      {error && (
        <p className="text-sm font-bold text-brutal-red">{error}</p>
      )}
    </div>
  )
}
