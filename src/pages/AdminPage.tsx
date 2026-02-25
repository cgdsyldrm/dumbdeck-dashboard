import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { ArrowLeft, Plus, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { AdminButtonCard } from '../components/AdminButtonCard'
import { StatusDot } from '../components/StatusDot'
import type { ButtonConfig, DeckConfig } from '../types'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function generateId(existing: string[]): string {
  let n = existing.length + 1
  while (existing.includes(`button${n}`)) n++
  return `button${n}`
}

export function AdminPage() {
  const { config, status, listenerConnected, updateAllButtons } = useSocket('admin')

  // Local editable state
  const [order, setOrder] = useState<string[]>([])
  const [localButtons, setLocalButtons] = useState<DeckConfig['buttons']>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [dirty, setDirty] = useState(false)

  // Sync from server config (only on first load / fresh config)
  useEffect(() => {
    if (config && !dirty) {
      setLocalButtons(config.buttons)
      setOrder(Object.keys(config.buttons))
    }
  }, [config, dirty])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
      setDirty(true)
    }
  }, [])

  const handleChange = useCallback((id: string, field: keyof ButtonConfig, value: string) => {
    setLocalButtons((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
    setDirty(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setOrder((prev) => prev.filter((k) => k !== id))
    setLocalButtons((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setDirty(true)
  }, [])

  const handleAdd = useCallback(() => {
    const id = generateId(order)
    const newBtn: ButtonConfig = { label: 'New Button', key: '', description: '' }
    setLocalButtons((prev) => ({ ...prev, [id]: newBtn }))
    setOrder((prev) => [...prev, id])
    setDirty(true)
  }, [order])

  const handleSave = useCallback(() => {
    // Build ordered buttons object
    const orderedButtons: DeckConfig['buttons'] = {}
    for (const id of order) {
      if (localButtons[id]) orderedButtons[id] = localButtons[id]
    }

    setSaveState('saving')
    updateAllButtons(orderedButtons)

    // Optimistic feedback (server echoes config_updated)
    setTimeout(() => {
      setSaveState('saved')
      setDirty(false)
      setTimeout(() => setSaveState('idle'), 2500)
    }, 400)
  }, [order, localButtons, updateAllButtons])

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-surface-border sticky top-0 z-10 bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              border border-surface-border text-white/50
              hover:border-accent/50 hover:text-white/80
              transition-all duration-150
            "
          >
            <ArrowLeft size={13} />
            Back
          </Link>
          <div className="w-px h-4 bg-surface-border" />
          <span className="text-sm font-semibold text-white/70">Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className={`w-2 h-2 rounded-full ${listenerConnected ? 'bg-success' : 'bg-white/20 animate-pulse'}`} />
            {listenerConnected ? 'Listener Connected' : 'Listener Disconnected'}
          </div>
          <StatusDot status={status} />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!dirty || saveState === 'saving' || status !== 'connected'}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 border
              ${dirty && status === 'connected'
                ? 'bg-accent border-accent text-white hover:bg-accent-hover shadow-glow-sm'
                : 'bg-surface-elevated border-surface-border text-white/30 cursor-not-allowed'
              }
            `}
          >
            {saveState === 'saving' && <Loader2 size={14} className="animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 size={14} className="text-success" />}
            {saveState === 'error' && <AlertCircle size={14} className="text-danger" />}
            {saveState === 'idle' && <Save size={14} />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Button Configuration</h1>
            <p className="text-sm text-white/40 mt-0.5">
              Drag to reorder · Click a hotkey field and press keys to record
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              border border-dashed border-accent/40 text-accent
              hover:bg-accent/10 hover:border-accent
              transition-all duration-150
            "
          >
            <Plus size={15} />
            Add Button
          </button>
        </div>

        {/* Dirty badge */}
        {dirty && (
          <div className="mb-4 flex items-center gap-2 text-xs text-warn bg-warn/10 border border-warn/20 rounded-lg px-3 py-2">
            <AlertCircle size={13} />
            Unsaved changes — remember to save!
          </div>
        )}

        {/* Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {order.map((id) => localButtons[id] && (
                <AdminButtonCard
                  key={id}
                  id={id}
                  config={localButtons[id]}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {order.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/30">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-surface-border flex items-center justify-center">
              <Plus size={24} className="text-white/20" />
            </div>
            <p className="text-sm">No buttons yet. Add one to get started.</p>
          </div>
        )}
      </main>

      {/* Settings panel */}
      {config?.settings && (
        <div className="border-t border-surface-border px-5 py-4 bg-surface-card">
          <div className="max-w-6xl mx-auto flex items-center gap-6 text-xs text-white/30">
            <span className="font-semibold text-white/50">Hub Settings</span>
            <span>Debounce: <span className="text-white/50">{config.settings.debounceMs}ms</span></span>
            <span>Remote Config: <span className={config.settings.allowRemoteConfig ? 'text-success' : 'text-danger'}>
              {config.settings.allowRemoteConfig ? 'Enabled' : 'Disabled'}
            </span></span>
          </div>
        </div>
      )}
    </div>
  )
}
