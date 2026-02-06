/** Shared helpers */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function isToday(isoString: string): boolean {
  return isoString.startsWith(new Date().toISOString().slice(0, 10));
}

export function showToast(message: string, durationMs = 2000): void {
  let toast = document.querySelector(".toast") as HTMLElement | null;
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast?.classList.remove("show"), durationMs);
}

/** Action icon for treatment logs. */
export function actionIcon(action: string): string {
  switch (action) {
    case "done":
      return "✅";
    case "skip":
      return "⏭️";
    case "snooze":
      return "⏰";
    default:
      return "•";
  }
}
