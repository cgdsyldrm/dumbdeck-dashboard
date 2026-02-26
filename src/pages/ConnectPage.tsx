import { useState, useCallback } from 'react'
import { Loader2, Wifi, AlertCircle, Lock } from 'lucide-react'
import { setHubAddress, setToken, buildWsUrl } from '../lib/hubStore'

interface ConnectPageProps {
  onConnected: () => void
}

export function ConnectPage({ onConnected }: ConnectPageProps) {
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('3000')
  const [token, setTokenInput] = useState('')
  const [state, setState] = useState<'idle' | 'connecting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleConnect = useCallback(() => {
    const host = `${ip.trim()}:${port.trim()}`
    if (!ip.trim() || !port.trim()) {
      setErrorMsg('Please enter an IP address and port.')
      setState('error')
      return
    }

    setState('connecting')
    setErrorMsg('')

    const ws = new WebSocket(buildWsUrl(host))
    let settled = false

    const fail = (msg: string) => {
      if (settled) return
      settled = true
      ws.close()
      setErrorMsg(msg)
      setState('error')
    }

    const timeout = setTimeout(() => {
      fail(`Could not reach hub at ${host}. Make sure it's running and on the same network.`)
    }, 5000)

    ws.onopen = () => {
      // Probe admin auth: send join_room and wait for room_joined or auth_error
      ws.send(JSON.stringify({ event: 'join_room', data: { role: 'admin', token: token.trim() } }))
    }

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string)
        if (msg.event === 'room_joined' && msg.data?.role === 'admin') {
          clearTimeout(timeout)
          if (settled) return
          settled = true
          ws.close()
          setHubAddress(host)
          setToken(token.trim())
          onConnected()
        } else if (msg.event === 'auth_error') {
          clearTimeout(timeout)
          fail('Invalid token. Check the admin token in your hub config.json.')
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      fail(`Connection refused at ${host}. Check the IP and port.`)
    }
  }, [ip, port, token, onConnected])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConnect()
  }, [handleConnect])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
            <Wifi size={26} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-white">Connect to Hub</h1>
          <p className="text-sm text-white/40 mt-1.5 text-center">
            Enter the IP address of the machine running&nbsp;
            <span className="font-mono text-white/60">dumbdeck-hub</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5 flex flex-col gap-4">

          <div className="flex gap-3">
            {/* IP */}
            <div className="flex-1">
              <label className="block text-xs text-white/50 mb-1.5 font-medium">IP Address</label>
              <input
                type="text"
                value={ip}
                onChange={e => setIp(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="192.168.1.88"
                autoFocus
                disabled={state === 'connecting'}
                className="
                  w-full bg-surface-elevated border border-surface-border rounded-xl
                  px-3 py-2.5 text-sm font-mono text-white
                  focus:outline-none focus:border-accent/60
                  disabled:opacity-50 transition-colors
                "
              />
            </div>

            {/* Port */}
            <div className="w-24">
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Port</label>
              <input
                type="text"
                value={port}
                onChange={e => setPort(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="3000"
                disabled={state === 'connecting'}
                className="
                  w-full bg-surface-elevated border border-surface-border rounded-xl
                  px-3 py-2.5 text-sm font-mono text-white
                  focus:outline-none focus:border-accent/60
                  disabled:opacity-50 transition-colors
                "
              />
            </div>
          </div>

          {/* Token */}
          <div>
            <label className="block text-xs text-white/50 mb-1.5 font-medium flex items-center gap-1.5">
              <Lock size={11} />
              Admin Token
              <span className="text-white/25 font-normal ml-0.5">(leave blank if not set)</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              disabled={state === 'connecting'}
              className="
                w-full bg-surface-elevated border border-surface-border rounded-xl
                px-3 py-2.5 text-sm font-mono text-white
                focus:outline-none focus:border-accent/60
                disabled:opacity-50 transition-colors
              "
            />
          </div>

          {/* Error */}
          {state === 'error' && (
            <div className="flex items-start gap-2 text-xs bg-danger/10 border border-danger/20 text-danger/80 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={state === 'connecting' || !ip.trim()}
            className="
              w-full py-2.5 rounded-xl text-sm font-semibold
              bg-accent hover:bg-accent-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white transition-colors flex items-center justify-center gap-2
            "
          >
            {state === 'connecting'
              ? <><Loader2 size={15} className="animate-spin" />Connecting…</>
              : 'Connect'
            }
          </button>
        </div>

        <p className="text-center text-xs text-white/20 mt-5">
          This address is saved locally and won't be asked again.
        </p>
      </div>
    </div>
  )
}
