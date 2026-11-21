import React from 'react';

type BadgeVariant =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  | 'LOW' | 'MEDIUM' | 'HIGH' | 'CONGESTED'
  | 'GREEN' | 'YELLOW' | 'ALL_RED'
  | 'ACTIVE' | 'FAULT' | 'OFFLINE'
  | 'AMBULANCE' | 'FIRE' | 'POLICE'
  | string;

export interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

const variantMap: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  ACTIVE: 'bg-green-100 text-green-800',
  GREEN: 'bg-green-100 text-green-800',
  LOW: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CONGESTED: 'bg-red-100 text-red-800',
  ALL_RED: 'bg-red-100 text-red-800',
  FAULT: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-gray-100 text-gray-700',
  OFFLINE: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  YELLOW: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  AMBULANCE: 'bg-blue-100 text-blue-800',
  FIRE: 'bg-orange-100 text-orange-800',
  POLICE: 'bg-indigo-100 text-indigo-800',
  PENDING_CONFIRM: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ABORTED: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

export function Badge({ variant = 'ACTIVE', label, className = '', children }: BadgeProps) {
  const cls = variantMap[variant] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {children ?? label ?? variant.replace(/_/g, ' ')}
    </span>
  );
}
