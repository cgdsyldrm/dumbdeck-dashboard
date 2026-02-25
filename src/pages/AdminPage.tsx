import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  SkipForward,
  SkipBack,
  Camera,
  Lock,
  Mic,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSocket } from '../hooks/useSocket'
import { ButtonCell } from '../components/ButtonCell'
import { HotkeyInput } from '../components/HotkeyInput'
import type { ButtonConfig, DeckConfig } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Page {
  id: string
  name: string
  buttons: DeckConfig['buttons']
  order: string[]
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface SystemHotkey {
  id: string
  label: string
  key: string
  icon: LucideIcon
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SYSTEM_HOTKEYS: SystemHotkey[] = [
  { id: 'volume_up', label: 'Volume Up', key: 'volumeup', icon: Volume2 },
  { id: 'volume_down', label: 'Volume Down', key: 'volumedown', icon: Volume1 },
  { id: 'volume_mute', label: 'Mute', key: 'volumemute', icon: VolumeX },
  { id: 'play_pause', label: 'Play / Pause', key: 'media_play_pause', icon: Play },
  { id: 'next_track', label: 'Next Track', key: 'media_next_track', icon: SkipForward },
  { id: 'prev_track', label: 'Prev Track', key: 'media_prev_track', icon: SkipBack },
  { id: 'screenshot', label: 'Screenshot', key: 'printscreen', icon: Camera },
  { id: 'lock', label: 'Lock Screen', key: 'super+l', icon: Lock },
  { id: 'mic_mute', label: 'Mic Mute', key: 'ctrl+shift+m', icon: Mic },
]

const GRID_COLS = [3, 4, 5, 6]
const GRID_ROWS = [2, 3, 4, 5]
const PAGES_KEY = 'dumbdeck:pages'
const GRID_KEY = 'dumbdeck:grid'

interface GridConfig { cols: number; rows: number; gap: number }

function loadGrid(): GridConfig | null {
  try {
    const raw = localStorage.getItem(GRID_KEY)
    if (raw) return JSON.parse(raw) as GridConfig
  } catch { /* ignore */ }
  return null
}

function persistGrid(grid: GridConfig) {
  localStorage.setItem(GRID_KEY, JSON.stringify(grid))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(existing: string[]): string {
  let n = existing.length + 1
  while (existing.includes(`button${n}`)) n++
  return `button${n}`
}

function loadPages(): Page[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY)
    if (raw) return JSON.parse(raw) as Page[]
  } catch {
    // ignore
  }
  return []
}

function persistPages(pages: Page[]) {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages))
}

function createPage(name: string): Page {
  return { id: crypto.randomUUID(), name, buttons: {}, order: [] }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyCell({
  cellIndex,
  onClick,
}: {
  cellIndex: number
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `empty:${cellIndex}` })
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={[
        'aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-150',
        isOver
          ? 'border-primary bg-primary/10 scale-[1.04]'
          : 'border-muted hover:border-muted-foreground/40 hover:bg-muted/20',
      ].join(' ')}
    >
      <Plus size={20} className={isOver ? 'text-primary' : 'text-muted-foreground/30'} />
    </div>
  )
}

function DraggableHotkey({
  hotkey,
  onQuickAssign,
}: {
  hotkey: SystemHotkey
  onQuickAssign: (h: SystemHotkey) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sys:${hotkey.id}`,
  })
  const Icon = hotkey.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onClick={() => !isDragging && onQuickAssign(hotkey)}
          className={[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 select-none',
            isDragging
              ? 'opacity-0 pointer-events-none'
              : 'border-transparent cursor-grab hover:bg-muted/60 hover:border-border active:cursor-grabbing',
          ].join(' ')}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium leading-tight">{hotkey.label}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">{hotkey.key}</div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left">
        Drag onto a button · Click to assign to selected
      </TooltipContent>
    </Tooltip>
  )
}

// ── AdminPage ─────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { config, status, listenerConnected, updateAllButtons } = useSocket('admin')

  // Pages
  const [pages, setPages] = useState<Page[]>([])
  const [activePageId, setActivePageId] = useState<string | null>(null)

  // Local editing state (active page)
  const [localButtons, setLocalButtons] = useState<DeckConfig['buttons']>({})
  const [order, setOrder] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  // Grid size & gap — initialized from localStorage for instant values on refresh
  const [cols, setCols] = useState<number>(() => loadGrid()?.cols ?? 4)
  const [rows, setRows] = useState<number>(() => loadGrid()?.rows ?? 3)
  const [gap, setGap] = useState<number>(() => loadGrid()?.gap ?? 12)
  const [gridReady, setGridReady] = useState<boolean>(() => loadGrid() !== null)
  const totalCells = cols * rows

  // Selection & rename
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Active drag
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Track whether grid was already initialized from server config
  const gridInitialized = useRef(false)

  // ── Bootstrap: load from localStorage, fallback to server config ───────────

  useEffect(() => {
    const stored = loadPages()
    if (stored.length > 0) {
      setPages(stored)
      setActivePageId(stored[0].id)
    }
  }, [])

  useEffect(() => {
    if (config) {
      if (config.grid && !gridInitialized.current) {
        const g = { cols: config.grid.cols, rows: config.grid.rows, gap: config.grid.gap ?? 12 }
        setCols(g.cols)
        setRows(g.rows)
        setGap(g.gap)
        persistGrid(g)
        gridInitialized.current = true
      }
      setGridReady(true)
      if (pages.length === 0) {
        const page: Page = {
          id: crypto.randomUUID(),
          name: 'Default',
          buttons: config.buttons,
          order: Object.keys(config.buttons),
        }
        setPages([page])
        setActivePageId(page.id)
      }
    }
  }, [config, pages.length])

  // ── Sync active page → local state ────────────────────────────────────────

  useEffect(() => {
    const page = pages.find((p) => p.id === activePageId)
    if (page) {
      setLocalButtons(page.buttons)
      setOrder(page.order)
      setDirty(false)
      setSelectedId(null)
    }
  // Only re-run when active page changes, not on every pages mutation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId])

  // ── Persist pages on change ────────────────────────────────────────────────

  useEffect(() => {
    if (pages.length > 0) persistPages(pages)
  }, [pages])

  // ── Flush local edits back into pages array ────────────────────────────────

  const flushToPages = useCallback(
    (btns = localButtons, ord = order) => {
      if (!activePageId) return
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, buttons: btns, order: ord } : p,
        ),
      )
    },
    [activePageId, localButtons, order],
  )

  // ── Button CRUD ────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (id: string, field: keyof ButtonConfig, value: string) => {
      setLocalButtons((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
      setDirty(true)
    },
    [],
  )

  const handleDelete = useCallback(
    (id: string) => {
      setOrder((prev) => prev.filter((k) => k !== id))
      setLocalButtons((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      if (selectedId === id) setSelectedId(null)
      setDirty(true)
    },
    [selectedId],
  )

  const handleAddAt = useCallback(
    (cellIndex: number) => {
      const id = generateId(order)
      const newBtn: ButtonConfig = { label: 'Button', key: '', description: '' }
      setLocalButtons((prev) => ({ ...prev, [id]: newBtn }))
      setOrder((prev) => {
        const next = [...prev]
        next.splice(cellIndex, 0, id)
        return next
      })
      setSelectedId(id)
      setDirty(true)
    },
    [order],
  )

  // ── DnD ────────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingId(null)
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      if (activeId.startsWith('sys:')) {
        const sysId = activeId.replace('sys:', '')
        const sys = SYSTEM_HOTKEYS.find((h) => h.id === sysId)
        if (!sys) return

        if (overId.startsWith('empty:')) {
          const cellIndex = parseInt(overId.replace('empty:', ''), 10)
          const id = generateId(order)
          const newBtn: ButtonConfig = { label: sys.label, key: sys.key, description: '' }
          setLocalButtons((prev) => ({ ...prev, [id]: newBtn }))
          setOrder((prev) => {
            const next = [...prev]
            next.splice(cellIndex, 0, id)
            return next.slice(0, totalCells)
          })
          setSelectedId(id)
        } else {
          handleChange(overId, 'key', sys.key)
          handleChange(overId, 'label', sys.label)
          setSelectedId(overId)
        }
        setDirty(true)
      } else {
        if (activeId !== overId && !overId.startsWith('empty:')) {
          setOrder((prev) => {
            const oldIndex = prev.indexOf(activeId)
            const newIndex = prev.indexOf(overId)
            if (oldIndex === -1 || newIndex === -1) return prev
            return arrayMove(prev, oldIndex, newIndex)
          })
          setDirty(true)
        }
      }
    },
    [order, totalCells, handleChange],
  )

  // ── Quick-assign from right panel click ────────────────────────────────────

  const handleQuickAssign = useCallback(
    (hotkey: SystemHotkey) => {
      if (!selectedId) return
      handleChange(selectedId, 'key', hotkey.key)
      handleChange(selectedId, 'label', hotkey.label)
    },
    [selectedId, handleChange],
  )

  // ── Save to hub ────────────────────────────────────────────────────────────

  const handleSave = useCallback(() => {
    const orderedButtons: DeckConfig['buttons'] = {}
    for (const id of order) {
      if (localButtons[id]) orderedButtons[id] = localButtons[id]
    }
    setSaveState('saving')
    updateAllButtons(orderedButtons, { cols, rows, gap })
    flushToPages()
    setTimeout(() => {
      setSaveState('saved')
      setDirty(false)
      setTimeout(() => setSaveState('idle'), 2500)
    }, 400)
  }, [order, localButtons, updateAllButtons, flushToPages, cols, rows, gap])

  // ── Page management ────────────────────────────────────────────────────────

  const handleAddPage = useCallback(() => {
    flushToPages()
    const page = createPage(`Page ${pages.length + 1}`)
    setPages((prev) => [...prev, page])
    setActivePageId(page.id)
    setDirty(false)
  }, [pages.length, flushToPages])

  const handleSelectPage = useCallback(
    (id: string) => {
      if (id === activePageId) return
      flushToPages()
      setActivePageId(id)
    },
    [activePageId, flushToPages],
  )

  const handleDeletePage = useCallback(
    (id: string) => {
      if (pages.length <= 1) return
      const newPages = pages.filter((p) => p.id !== id)
      setPages(newPages)
      if (activePageId === id) setActivePageId(newPages[0].id)
    },
    [pages, activePageId],
  )

  const handleRenamePage = useCallback(
    (id: string) => {
      if (!renameValue.trim()) return
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: renameValue.trim() } : p)),
      )
      setRenamingId(null)
    },
    [renameValue],
  )

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedButton = selectedId ? localButtons[selectedId] : null

  const hubBadge =
    status === 'connected' ? (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
        Hub Active
      </Badge>
    ) : status === 'connecting' ? (
      <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 animate-pulse">
        Connecting…
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-400 border-red-500/30 animate-pulse">
        Hub Offline
      </Badge>
    )

  const listenerBadge = listenerConnected ? (
    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
      Listener On
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Listener Off
    </Badge>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={400}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-screen flex flex-col bg-background text-foreground dark overflow-hidden">
          {/* ── Header ──────────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm z-20">
            <span className="font-bold text-sm tracking-tight">Dumbdeck</span>
            <div className="flex items-center gap-2">
              {hubBadge}
              {listenerBadge}
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!dirty || saveState === 'saving' || status !== 'connected'}
                className="h-7 px-3 text-xs gap-1.5"
              >
                {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
                {saveState === 'saved' && <CheckCircle2 size={12} />}
                {saveState === 'error' && <AlertCircle size={12} />}
                {saveState === 'idle' && <Save size={12} />}
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'saved'
                    ? 'Saved!'
                    : 'Save'}
              </Button>
            </div>
          </header>

          {/* ── Body ────────────────────────────────────────────────────────── */}
          <div className="flex flex-1 overflow-hidden">
            {/* ── Left: Pages ─────────────────────────────────────────────── */}
            <aside className="w-44 border-r border-border flex flex-col shrink-0 bg-muted/10">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Pages
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5"
                      onClick={handleAddPage}
                    >
                      <Plus size={13} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New page</TooltipContent>
                </Tooltip>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 flex flex-col gap-1">
                  {pages.map((page) => (
                    <div key={page.id} className="group relative">
                      {renamingId === page.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRenamePage(page.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          className="w-full px-2 py-1 text-sm rounded-lg border border-primary bg-background outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => handleSelectPage(page.id)}
                          onDoubleClick={() => {
                            setRenamingId(page.id)
                            setRenameValue(page.name)
                          }}
                          className={[
                            'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                            activePageId === page.id
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                          ].join(' ')}
                        >
                          {page.name}
                        </button>
                      )}
                      {pages.length > 1 && renamingId !== page.id && (
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            {/* ── Center: Grid ─────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Grid header */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cols</span>
                  <Select value={String(cols)} onValueChange={(v) => { const n = Number(v); setCols(n); persistGrid({ cols: n, rows, gap }); setDirty(true) }}>
                    <SelectTrigger className="h-7 w-14 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRID_COLS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows</span>
                  <Select value={String(rows)} onValueChange={(v) => { const n = Number(v); setRows(n); persistGrid({ cols, rows: n, gap }); setDirty(true) }}>
                    <SelectTrigger className="h-7 w-14 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRID_ROWS.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Gap</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={64}
                      value={gap}
                      onChange={(e) => {
                        const n = Math.min(64, Math.max(0, Number(e.target.value) || 0))
                        setGap(n)
                        persistGrid({ cols, rows, gap: n })
                        setDirty(true)
                      }}
                      className="h-7 w-16 text-xs px-2"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="flex-1" />
                {dirty && (
                  <span className="text-xs text-yellow-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Unsaved
                  </span>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => {
                        setOrder([])
                        setLocalButtons({})
                        setSelectedId(null)
                        setDirty(true)
                      }}
                    >
                      Clear All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove all buttons from this page</TooltipContent>
                </Tooltip>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-auto p-4">
                {!gridReady && (
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${gap}px` }}
                  >
                    {Array.from({ length: totalCells }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded-2xl" />
                    ))}
                  </div>
                )}
                {gridReady && (
                <SortableContext items={order} strategy={rectSortingStrategy}>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: `${gap}px` }}
                  >
                    {Array.from({ length: totalCells }).map((_, cellIndex) => {
                      const buttonId = order[cellIndex]
                      if (buttonId && localButtons[buttonId]) {
                        return (
                          <ButtonCell
                            key={buttonId}
                            id={buttonId}
                            config={localButtons[buttonId]}
                            isSelected={selectedId === buttonId}
                            onClick={() =>
                              setSelectedId((prev) =>
                                prev === buttonId ? null : buttonId,
                              )
                            }
                          />
                        )
                      }
                      return (
                        <EmptyCell
                          key={`empty-${cellIndex}`}
                          cellIndex={cellIndex}
                          onClick={() => handleAddAt(cellIndex)}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
                )}
              </div>
            </main>

            {/* ── Right: System Keys ───────────────────────────────────────── */}
            <aside className="w-56 border-l border-border flex flex-col shrink-0 bg-muted/10">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  System Keys
                </span>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                  Drag onto a button
                </p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 flex flex-col gap-0.5">
                  {SYSTEM_HOTKEYS.map((hotkey) => (
                    <DraggableHotkey
                      key={hotkey.id}
                      hotkey={hotkey}
                      onQuickAssign={handleQuickAssign}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Custom hotkey */}
              <div className="border-t border-border p-3 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Custom
                </span>
                {selectedId && selectedButton ? (
                  <>
                    <HotkeyInput
                      value={selectedButton.key}
                      onChange={(k) => handleChange(selectedId, 'key', k)}
                    />
                    <p className="text-[11px] text-muted-foreground/50">
                      Assigns to selected button
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50">
                    Select a button first
                  </p>
                )}
              </div>
            </aside>
          </div>

          {/* ── Bottom Panel: Selected button editor ─────────────────────────── */}
          {selectedId && selectedButton && (
            <div className="border-t border-border bg-background/95 backdrop-blur-sm shrink-0 px-4 py-3 flex items-center gap-4">
              {/* Icon placeholder */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-11 h-11 rounded-xl border-2 border-dashed border-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors shrink-0">
                    <Zap size={18} className="text-muted-foreground/30" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Icon upload — coming soon</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-10" />

              {/* Fields */}
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selectedButton.label}
                    onChange={(e) => handleChange(selectedId, 'label', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Button label…"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={selectedButton.description ?? ''}
                    onChange={(e) =>
                      handleChange(selectedId, 'description', e.target.value)
                    }
                    className="h-8 text-sm"
                    placeholder="Optional…"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Hotkey</Label>
                  <HotkeyInput
                    value={selectedButton.key}
                    onChange={(k) => handleChange(selectedId, 'key', k)}
                  />
                </div>
              </div>

              <Separator orientation="vertical" className="h-10" />

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-1.5"
                  onClick={() => handleDelete(selectedId)}
                >
                  <Trash2 size={13} />
                  Delete
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setSelectedId(null)}
                >
                  <X size={13} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Drag Overlay ─────────────────────────────────────────────────── */}
        <DragOverlay dropAnimation={null}>
          {draggingId?.startsWith('sys:') && (() => {
            const sys = SYSTEM_HOTKEYS.find((h) => `sys:${h.id}` === draggingId)
            if (!sys) return null
            const Icon = sys.icon
            return (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-background shadow-xl cursor-grabbing select-none opacity-95 w-48">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{sys.label}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{sys.key}</div>
                </div>
              </div>
            )
          })()}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  )
}
