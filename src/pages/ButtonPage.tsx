import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Wifi, WifiOff, Loader2, Copy, Check } from 'lucide-react'
import { useSocket, WS_URL } from '../hooks/useSocket'
import { ButtonTile } from '../components/ButtonTile'
import { StatusDot } from '../components/StatusDot'

const hubHost = new URL(WS_URL.replace('ws://', 'http://').replace('wss://', 'https://')).host

export function ButtonPage() {
  const { config, status, listenerConnected, triggerKey } = useSocket('button_ui')
  const [copied, setCopied] = useState(false)

  const handleTrigger = useCallback((id: string) => {
    triggerKey(id)
  }, [triggerKey])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(hubHost).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const buttons = config ? Object.entries(config.buttons) : []

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-accent text-xs font-bold">DD</span>
          </div>
          <span className="text-sm font-semibold text-white/70 hidden sm:block">DumbDeck</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className={`w-2 h-2 rounded-full ${listenerConnected ? 'bg-success' : 'bg-white/20 animate-pulse'}`} />
            {listenerConnected ? 'Listener Connected' : 'Listener Disconnected'}
          </div>

          <div className="w-px h-4 bg-surface-border" />

          <button
            onClick={handleCopy}
            title="Copy hub address for Listener setup"
            className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
          >
            {copied
              ? <><Check size={11} className="text-success" /><span className="text-success">Copied!</span></>
              : <><span>{hubHost}</span><Copy size={11} /></>
            }
          </button>

          <div className="w-px h-4 bg-surface-border" />

          <StatusDot status={status} />
          <Link
            to="/admin"
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              border border-surface-border text-white/50
              hover:border-accent/50 hover:text-white/80
              transition-all duration-150
            "
          >
            <Settings size={13} />
            Admin
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {status === 'connecting' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30">
            <Loader2 size={40} className="animate-spin text-accent/50" />
            <p className="text-sm">Connecting to hub…</p>
          </div>
        )}

        {status === 'disconnected' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
              <WifiOff size={28} className="text-danger/70" />
            </div>
            <div className="text-center">
              <p className="text-white/60 font-medium">Hub Disconnected</p>
              <p className="text-white/30 text-sm mt-1">Reconnecting automatically…</p>
            </div>
          </div>
        )}

        {status === 'connected' && buttons.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/30">
            <Wifi size={40} className="text-accent/30" />
            <p className="text-sm">No buttons configured yet.</p>
            <Link
              to="/admin"
              className="text-accent text-sm hover:text-accent-glow transition-colors"
            >
              Go to Admin →
            </Link>
          </div>
        )}

        {status === 'connected' && buttons.length > 0 && (
          <div
            className="
              grid gap-3 sm:gap-4
              grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
            "
          >
            {buttons.map(([id, btn]) => (
              <ButtonTile
                key={id}
                id={id}
                label={btn.label}
                keyCombo={btn.key}
                description={btn.description}
                icon={btn.icon}
                onTrigger={handleTrigger}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-5 py-3 border-t border-surface-border flex items-center justify-between">
        <span className="text-[10px] text-white/20 font-mono">
          {buttons.length} button{buttons.length !== 1 ? 's' : ''} loaded
        </span>
        <span className="text-[10px] text-white/20">
          ws://localhost:3000
        </span>
      </footer>
    </div>
  )
}
