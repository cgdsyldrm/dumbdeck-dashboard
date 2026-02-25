import { useState, useCallback, useRef } from 'react'
import { Keyboard } from 'lucide-react'

interface Props {
  value: string
  onChange: (key: string) => void
  placeholder?: string
}

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'Super'])

function buildCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('ctrl')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  if (e.metaKey) parts.push('cmd')

  const key = e.key.toLowerCase()
  if (!MODIFIER_KEYS.has(e.key)) {
    if (key === ' ') parts.push('space')
    else if (key.startsWith('arrow')) parts.push(key.replace('arrow', ''))
    else parts.push(key)
  }

  return parts.join('+')
}

export function HotkeyInput({ value, onChange, placeholder = 'Click and press keys…' }: Props) {
  const [recording, setRecording] = useState(false)
  const [preview, setPreview] = useState('')
  const inputRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    const combo = buildCombo(e.nativeEvent)
    if (combo) setPreview(combo)
  }, [])

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    const combo = buildCombo(e.nativeEvent)
    if (combo && !MODIFIER_KEYS.has(e.key)) {
      onChange(combo)
      setRecording(false)
      setPreview('')
      inputRef.current?.blur()
    }
  }, [onChange])

  const displayValue = recording ? (preview || '…') : (value || placeholder)

  return (
    <div
      ref={inputRef}
      tabIndex={0}
      onFocus={() => setRecording(true)}
      onBlur={() => { setRecording(false); setPreview('') }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
        font-mono text-sm transition-all duration-150 outline-none
        ${recording
          ? 'border-accent bg-accent/10 text-accent-glow shadow-[0_0_12px_rgba(124,58,237,0.3)]'
          : value
            ? 'border-surface-border bg-surface-elevated text-white/80 hover:border-accent/50'
            : 'border-surface-border bg-surface-elevated text-white/30 hover:border-accent/50'
        }
      `}
      aria-label="Hotkey input"
    >
      <Keyboard size={14} className={recording ? 'text-accent animate-pulse' : 'text-white/30'} />
      <span className="flex-1 truncate">{displayValue}</span>
      {recording && (
        <span className="text-[10px] text-accent/60 shrink-0">ESC to cancel</span>
      )}
    </div>
  )
}
