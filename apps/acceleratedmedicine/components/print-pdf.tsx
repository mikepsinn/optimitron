"use client"

import { useEffect } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"

/**
 * Opens the browser's print window, where the reader can choose Save as PDF. The PDF comes from the
 * page itself, so it always matches the site. Lazy images, such as those on slides that are not on
 * screen, load first so they print.
 */
export async function printWhenReady() {
  const images = Array.from(document.images)
  for (const image of images) image.loading = "eager"
  await Promise.all(
    images
      .filter(image => !image.complete)
      .map(image => new Promise(resolve => {
        image.addEventListener("load", resolve, { once: true })
        image.addEventListener("error", resolve, { once: true })
      })),
  )
  await document.fonts.ready
  window.print()
}

/** Opens the print window when the address has ?print, so a link can go straight to the PDF (/resources). */
export function PrintOnRequest() {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("print")) return
    // A reload should not print again.
    url.searchParams.delete("print")
    window.history.replaceState(null, "", url)
    void printWhenReady()
  }, [])
  return null
}

export function SavePdfButton({ className }: { className?: string }) {
  return (
    <Button className={className} onClick={() => void printWhenReady()}>
      <FileDown aria-hidden="true" className="mr-2 h-4 w-4" /> Save as PDF
    </Button>
  )
}
