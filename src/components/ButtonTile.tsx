import { useState, useCallback } from 'react'
import {
  Terminal, Music, Volume2, VolumeX, Volume1, Camera, Lock,
  Zap, Keyboard, Play, Pause, ChevronUp, ChevronDown,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  terminal: Terminal,
  music: Music,
  volume2: Volume2,
  volumex: VolumeX,
  volume1: Volume1,
  camera: Camera,
  lock: Lock,
  zap: Zap,
  keyboard: Keyboard,
  play: Play,
  pause: Pause,
  chevronup: ChevronUp,
  chevrondown: ChevronDown,
}

function guessIcon(label: string, key: string): LucideIcon {
  const combined = (label + key).toLowerCase()
  if (combined.includes('terminal') || combined.includes('cmd')) return Terminal
  if (combined.includes('play') || combined.includes('pause') || combined.includes('media')) return Music
  if (combined.includes('volumeup') || combined.includes('volume up')) return Volume2
  if (combined.includes('volumedown') || combined.includes('volume down')) return Volume1
  if (combined.includes('mute') || combined.includes('volumemute')) return VolumeX
  if (combined.includes('screenshot') || combined.includes('screen')) return Camera
  if (combined.includes('lock')) return Lock
  return Zap
}

interface Props {
  id: string
  label: string
  keyCombo: string
  description?: string
  icon?: string
  onTrigger: (id: string) => void
}

export function ButtonTile({ id, label, keyCombo, description, icon, onTrigger }: Props) {
  const [pressed, setPressed] = useState(false)
  const [triggered, setTriggered] = useState(false)

  const IconComponent = icon ? (ICON_MAP[icon.toLowerCase()] ?? Zap) : guessIcon(label, keyCombo)

  const handlePress = useCallback(() => {
    setPressed(true)
    setTriggered(true)
    onTrigger(id)

    setTimeout(() => setPressed(false), 120)
    setTimeout(() => setTriggered(false), 600)
  }, [id, onTrigger])

  return (
    <button
      onClick={handlePress}
      className={`
        group relative flex flex-col items-center justify-center gap-3
        w-full aspect-square rounded-2xl border
        bg-surface-card border-surface-border
        btn-press cursor-pointer select-none outline-none
        transition-all duration-150
        hover:border-accent hover:bg-surface-elevated hover:glow-accent-sm
        focus-visible:ring-2 focus-visible:ring-accent
        ${pressed ? 'scale-[0.93] border-accent glow-accent' : ''}
        ${triggered ? 'border-accent/80' : ''}
      `}
      title={description}
      aria-label={label}
    >
      {/* Glow overlay on press */}
      <div
        className={`
          absolute inset-0 rounded-2xl bg-accent/10 pointer-events-none
          transition-opacity duration-150
          ${pressed ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Icon */}
      <div
        className={`
          w-10 h-10 flex items-center justify-center rounded-xl
          bg-accent/10 transition-all duration-150
          group-hover:bg-accent/20 group-hover:scale-110
          ${pressed ? 'bg-accent/30 scale-110' : ''}
        `}
      >
        <IconComponent
          size={22}
          className={`
            transition-colors duration-150
            ${triggered ? 'text-accent-glow' : 'text-accent'}
          `}
        />
      </div>

      {/* Label */}
      <span className="text-sm font-semibold text-white/90 text-center leading-tight px-2">
        {label}
      </span>

      {/* Key combo badge */}
      <span className="text-[10px] text-white/30 font-mono tracking-wide">
        {keyCombo}
      </span>

      {/* Triggered flash ring */}
      {triggered && (
        <div className="absolute inset-0 rounded-2xl border-2 border-accent-glow opacity-0 animate-ping pointer-events-none" />
      )}
    </button>
  )
}
