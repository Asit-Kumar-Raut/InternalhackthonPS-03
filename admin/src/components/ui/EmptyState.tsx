import type { ReactNode } from 'react'
import { InboxIcon } from 'lucide-react'

interface EmptyStateProps {
  message?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ message = 'No data', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
      <div className="text-border-green">
        {icon ?? <InboxIcon size={40} strokeWidth={1} />}
      </div>
      <p className="text-sm">{message}</p>
      {action}
    </div>
  )
}
