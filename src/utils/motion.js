// True when the person has asked their device for less motion (iOS/Android/macOS/Windows setting)
export function prefersReducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}
