import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HotkeyInput } from './HotkeyInput'
import type { ButtonConfig } from '../types'

interface Props {
  id: string
  config: ButtonConfig
  onChange: (id: string, field: keyof ButtonConfig, value: string) => void
  onDelete: (id: string) => void
}

export function AdminButtonCard({ id, config, onChange, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex flex-col gap-3 p-4 rounded-2xl border
        bg-surface-card transition-all duration-150
        ${isDragging
          ? 'border-accent shadow-glow z-50 opacity-90 scale-[1.02]'
          : 'border-surface-border hover:border-accent/40'
        }
      `}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50 transition-colors p-1 -ml-1 shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>

        {/* Button ID badge */}
        <span className="text-[10px] font-mono text-white/30 bg-surface-elevated px-2 py-0.5 rounded-full shrink-0">
          {id}
        </span>

        <div className="flex-1" />

        {/* Delete */}
        <button
          onClick={() => onDelete(id)}
          className="p-1.5 rounded-lg text-white/20 hover:text-danger hover:bg-danger/10 transition-all"
          aria-label={`Delete ${config.label}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Label */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
          Label
        </label>
        <input
          type="text"
          value={config.label}
          onChange={(e) => onChange(id, 'label', e.target.value)}
          placeholder="Button label…"
          className="
            w-full px-3 py-2 rounded-lg border border-surface-border
            bg-surface-elevated text-sm text-white/90
            placeholder:text-white/20 outline-none
            focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-all duration-150
          "
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
          Description
        </label>
        <input
          type="text"
          value={config.description ?? ''}
          onChange={(e) => onChange(id, 'description', e.target.value)}
          placeholder="Optional description…"
          className="
            w-full px-3 py-2 rounded-lg border border-surface-border
            bg-surface-elevated text-sm text-white/90
            placeholder:text-white/20 outline-none
            focus:border-accent focus:ring-1 focus:ring-accent/30
            transition-all duration-150
          "
        />
      </div>

      {/* Hotkey */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-white/40 font-medium uppercase tracking-wider">
          Hotkey
        </label>
        <HotkeyInput
          value={config.key}
          onChange={(k) => onChange(id, 'key', k)}
        />
      </div>
    </div>
  )
}
