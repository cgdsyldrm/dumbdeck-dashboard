const HUB_KEY = 'dumbdeck_hub'

export function getHubAddress(): string | null {
  return localStorage.getItem(HUB_KEY)
}

export function setHubAddress(host: string): void {
  localStorage.setItem(HUB_KEY, host)
}

export function clearHubAddress(): void {
  localStorage.removeItem(HUB_KEY)
}

export function buildWsUrl(host: string): string {
  return `ws://${host}`
}

/** Returns the WS URL to use, in priority order:
 *  1. VITE_WS_URL env var (build-time)
 *  2. localStorage saved address
 *  3. window.location.host (works when served by the hub itself)
 */
export function resolveWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL as string
  const saved = getHubAddress()
  if (saved) return buildWsUrl(saved)
  return `ws://${window.location.host}`
}

/** Returns true if the onboarding screen should be shown. */
export function needsOnboarding(): boolean {
  if (import.meta.env.VITE_WS_URL) return false
  if (getHubAddress()) return false
  // If served directly by the hub (port 3000 by default), skip onboarding
  if (window.location.port === '3000') return false
  return true
}
