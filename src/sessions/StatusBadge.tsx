import type { SessionStatus } from '../api/types.ts'
import { STATUS_LABELS } from './sessionDomain.ts'

export function StatusBadge({ status }: { status: SessionStatus }) {
  const symbol =
    status === 'scheduled'
      ? '●'
      : status === 'full'
        ? '!'
        : status === 'cancelled'
          ? '×'
          : '✓'

  return (
    <span className={`status-badge status-${status}`}>
      <span aria-hidden="true">{symbol}</span>
      {STATUS_LABELS[status]}
    </span>
  )
}
