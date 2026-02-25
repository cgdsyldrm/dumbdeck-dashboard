import type { ConnectionStatus } from '../hooks/useSocket'

interface Props {
  status: ConnectionStatus
}

const labels: Record<ConnectionStatus, string> = {
  connecting: 'Hub Activating…',
  connected: 'Hub Active',
  disconnected: 'Hub Inactive',
}

const colors: Record<ConnectionStatus, string> = {
  connecting: 'bg-warn animate-pulse',
  connected: 'bg-success',
  disconnected: 'bg-danger animate-pulse',
}

export function StatusDot({ status }: Props) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/50">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {labels[status]}
    </div>
  )
}
