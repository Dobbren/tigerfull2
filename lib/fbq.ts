// Shared Meta Pixel helper. The pixel itself is injected by the UTMify
// script in the root layout; this only fires events when fbq is available,
// so it never throws if the pixel has not loaded yet.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackFb(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}
