/**
 * Copy text to the clipboard with a fallback for non-secure contexts.
 *
 * `navigator.clipboard` is only available on HTTPS and `http://localhost` —
 * custom dev hosts like `1percenttreaty.local` are not secure contexts and
 * `navigator.clipboard` is `undefined` there. Calling `.writeText` directly
 * throws a TypeError before a promise is returned, so `.catch` never runs.
 *
 * This helper probes for the modern API first, then falls back to the legacy
 * `document.execCommand("copy")` flow via a hidden textarea.
 */
export function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Clipboard unavailable"));
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
}
