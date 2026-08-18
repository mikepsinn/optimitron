import React, { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export function Textarea({
  placeholder = "Enter text...",
  className = "",
  ...props
}: TextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      rows={4}
      className={cn(
        "px-4 py-2 w-full border-2 rounded-none border-border shadow-xs transition focus:outline-hidden focus:shadow-none placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
