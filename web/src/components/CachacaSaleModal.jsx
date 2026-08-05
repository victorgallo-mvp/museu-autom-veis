import { useEffect, useState } from 'react';

const inputClass =
  'w-full bg-background border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-text-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}

const EMPTY_FORM = { soldAt: '', bottleCount: '', notes: '' };

export function CachacaSaleModal({ open, sale, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        sale
          ? {
              soldAt: sale.soldAt.slice(0, 10),
              bottleCount: sale.bottleCount,
              notes: sale.notes ?? '',
            }
          : EMPTY_FORM
      );
    }
  }, [open, sale]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      soldAt: new Date(form.soldAt).toISOString(),
      bottleCount: Number(form.bottleCount),
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full space-y-4"
      >
        <h2 className="font-display text-lg text-text-primary">
          {sale ? 'Editar venda' : 'Nova venda de cachaca'}
        </h2>

        <Field label="Data da venda">
          <input
            required
            type="date"
            value={form.soldAt}
            onChange={(e) => setForm((f) => ({ ...f, soldAt: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Quantidade de garrafas">
          <input
            required
            type="number"
            min="1"
            value={form.bottleCount}
            onChange={(e) => setForm((f) => ({ ...f, bottleCount: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Observacao">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
