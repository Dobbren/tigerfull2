// Keys we want to persist across navigation so they reach the checkout
const TRACKED_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "src",
  "sck",
  "fbclid",
  "gclid",
  "ttclid",
  "xcod",
]

const STORAGE_KEY = "tracking_params"

// Capture incoming tracking params from the current URL and merge them into
// sessionStorage so they survive client-side navigation (router.push).
export function captureTrackingParams() {
  if (typeof window === "undefined") return
  try {
    const current = new URLSearchParams(window.location.search)
    const stored = getStoredTrackingParams()
    let changed = false

    TRACKED_KEYS.forEach((key) => {
      const value = current.get(key)
      if (value && stored[key] !== value) {
        stored[key] = value
        changed = true
      }
    })

    if (changed) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    }
  } catch {
    /* sessionStorage may be unavailable (private mode) — ignore */
  }
}

export function getStoredTrackingParams(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}
