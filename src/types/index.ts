export interface ButtonConfig {
  label: string
  key: string
  description?: string
  icon?: string
}

export interface DeckConfig {
  buttons: Record<string, ButtonConfig>
  settings: {
    debounceMs: number
    allowRemoteConfig: boolean
  }
  grid?: {
    cols: number
    rows: number
    gap: number
  }
}

export type WsEvent =
  | { event: 'config_loaded'; data: DeckConfig }
  | { event: 'config_updated'; data: DeckConfig }
  | { event: 'room_joined'; data: { role: string } }
  | { event: 'trigger_key_ack'; data: { buttonId: string; key: string } }
  | { event: 'error'; data: { message: string } }
  | { event: 'auth_error'; data: { message: string } }
  | { event: 'listener_status'; data: { connected: boolean } }

export type ClientRole = 'button_ui' | 'admin' | 'desktop'
