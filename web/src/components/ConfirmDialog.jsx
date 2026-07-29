export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full">
        <h2 className="font-display text-lg text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary text-sm mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded text-sm bg-error hover:opacity-90 text-text-primary transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
