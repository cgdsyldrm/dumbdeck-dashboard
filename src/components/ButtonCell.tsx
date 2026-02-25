import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Zap } from 'lucide-react'
import type { ButtonConfig } from '../types'

interface Props {
  id: string
  config: ButtonConfig
  isSelected: boolean
  onClick: () => void
}

export function ButtonCell({ id, config, isSelected, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={[
        'relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-3',
        'cursor-pointer select-none transition-all duration-150 group',
        isDragging ? 'opacity-40 z-50 scale-95' : '',
        isOver ? 'border-primary bg-primary/15 scale-[1.05] shadow-lg' : '',
        isSelected && !isOver
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
          : '',
        !isSelected && !isOver
          ? 'border-border hover:border-muted-foreground/40 hover:bg-muted/20'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 touch-none cursor-grab active:cursor-grabbing p-0.5 rounded transition-opacity"
        aria-label="Drag to reorder"
      >
        <GripVertical size={12} className="text-muted-foreground" />
      </button>

      {/* Icon */}
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 transition-all duration-150 group-hover:bg-primary/20">
        <Zap size={20} className="text-primary" />
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-center leading-tight line-clamp-2 w-full px-1">
        {config.label || <span className="text-muted-foreground italic">Unnamed</span>}
      </span>

      {/* Key combo */}
      {config.key && (
        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-full px-1">
          {config.key}
        </span>
      )}
    </div>
  )
}
