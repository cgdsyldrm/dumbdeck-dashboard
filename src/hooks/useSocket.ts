import { useEffect, useRef, useCallback, useState } from 'react'
import type { ClientRole, DeckConfig, WsEvent } from '../types'
import { resolveWsUrl, getToken, clearHubAddress } from '../lib/hubStore'

export const WS_URL = resolveWsUrl()

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'unauthorized'

interface UseSocketReturn {
  config: DeckConfig | null
  status: ConnectionStatus
  listenerConnected: boolean
  send: (event: string, data?: Record<string, unknown>) => void
  triggerKey: (buttonId: string) => void
  updateConfig: (payload: { buttonId: string; key: string; label?: string; description?: string }) => void
  updateAllButtons: (buttons: DeckConfig['buttons'], grid?: { cols: number; rows: number; gap: number }) => void
}

export function useSocket(role: ClientRole): UseSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const [config, setConfig] = useState<DeckConfig | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [listenerConnected, setListenerConnected] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const send = useCallback((event: string, data: Record<string, unknown> = {}) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }))
    }
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      setStatus('connected')
      const token = getToken()
      ws.send(JSON.stringify({ event: 'join_room', data: { role, ...(token ? { token } : {}) } }))
    }

    ws.onmessage = (e) => {
      if (!mountedRef.current) return
      try {
        const msg = JSON.parse(e.data as string) as WsEvent
        if (msg.event === 'config_loaded' || msg.event === 'config_updated') {
          setConfig(msg.data)
        }
        if (msg.event === 'listener_status') {
          setListenerConnected(msg.data.connected)
        }
        if (msg.event === 'auth_error') {
          // Token is wrong — clear saved credentials and reload to show ConnectPage
          clearHubAddress()
          window.location.reload()
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      setListenerConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [role])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const triggerKey = useCallback((buttonId: string) => {
    send('trigger_key', { buttonId })
  }, [send])

  const updateConfig = useCallback((
    payload: { buttonId: string; key: string; label?: string; description?: string }
  ) => {
    send('update_config', payload)
  }, [send])

  const updateAllButtons = useCallback((buttons: DeckConfig['buttons'], grid?: { cols: number; rows: number; gap: number }) => {
    send('update_config', { buttons, ...(grid ? { grid } : {}) })
  }, [send])

  return { config, status, listenerConnected, send, triggerKey, updateConfig, updateAllButtons }
}
