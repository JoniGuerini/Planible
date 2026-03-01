import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Dialog de confirmação customizado — compatível com a interface do jogo.
 * Substitui confirm() nativo por um modal integrado ao design.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message = '',
  confirmLabel = 'OK',
  cancelLabel = 'Cancelar',
  confirmVariant = 'destructive',
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Card do dialog */}
      <div
        className={cn(
          'relative w-full max-w-sm rounded-xl border p-6 shadow-xl',
          'bg-slate-700/90 dark:bg-slate-800/90 border-slate-600/50 dark:border-slate-700/50'
        )}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8">
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
            className="h-8"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
