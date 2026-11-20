"use client"

import { useEffect } from "react"
import { captureTrackingParams } from "@/lib/utm"

// Captures UTM / click-id params on entry and whenever the URL changes,
// persisting them so they survive navigation and reach the checkout link.
export function TrackingParams() {
  useEffect(() => {
    captureTrackingParams()
  }, [])

  return null
}
