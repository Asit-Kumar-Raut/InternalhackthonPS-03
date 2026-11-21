import React, { type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const isVisible = open ?? isOpen ?? false;
  if (!isVisible) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl border border-[#BBF7D0] shadow-xl w-full ${widths[size]} flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-[#BBF7D0]">
          <h3 className="text-base font-bold text-[#166534]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-4 border-t border-[#BBF7D0] flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
