import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={`bg-white rounded-card border border-border-green shadow-card ${padding ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
