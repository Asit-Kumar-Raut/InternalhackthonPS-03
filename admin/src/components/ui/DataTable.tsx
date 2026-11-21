import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onRowClick?: (row: T) => void
  keyExtractor: (row: T) => string | number
  emptyMessage?: string
  striped?: boolean
}

export function DataTable<T>({
  columns,
  data,
  loading,
  error,
  onRetry,
  onRowClick,
  keyExtractor,
  emptyMessage = 'No data found',
  striped = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const av = (a as Record<string, unknown>)[sortKey]
    const bv = (b as Record<string, unknown>)[sortKey]
    if (av === bv) return 0
    const cmp = String(av) < String(bv) ? -1 : 1
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (error) return (
    <div className="flex flex-col items-center py-16 gap-3 text-danger">
      <p>{error}</p>
      {onRetry && <button onClick={onRetry} className="text-sm underline text-primary">Retry</button>}
    </div>
  )
  if (data.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-text-primary">
        <thead>
          <tr className="border-b border-border-green">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold text-text-secondary whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none' : ''} ${col.className ?? ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-border-green">
                      {sortKey === col.key
                        ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
                        : <ChevronUp size={14} className="opacity-30" />}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={keyExtractor(row)}
              className={`border-b border-border-green last:border-0 transition-colors ${striped && i % 2 === 1 ? 'bg-surface' : 'bg-white'} ${onRowClick ? 'cursor-pointer hover:bg-green-50' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
