/**
 * Copies text to the clipboard. `navigator.clipboard` exists only on HTTPS and localhost, so other hosts fall
 * back to a hidden textarea and `document.execCommand("copy")`.
 * Copied from packages/site-kit/src/lib/clipboard.ts.
 */
export function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Clipboard unavailable"))
  }
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand("copy")
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok ? Promise.resolve() : Promise.reject(new Error("Copy failed"))
}
