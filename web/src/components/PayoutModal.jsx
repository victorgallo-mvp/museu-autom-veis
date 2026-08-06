import { useEffect, useState } from 'react';
import { PAYOUT_CATEGORY_LABELS, PAYOUT_CATEGORY_OPTIONS } from '../lib/payoutCategory';

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

const EMPTY_FORM = { category: 'GENERAL', amount: '', paidAt: '', notes: '' };

export function PayoutModal({ open, payout, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        payout
          ? {
              category: payout.category,
              amount: payout.amount,
              paidAt: payout.paidAt.slice(0, 10),
              notes: payout.notes ?? '',
            }
          : EMPTY_FORM
      );
    }
  }, [open, payout]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      category: form.category,
      amount: Number(form.amount),
      paidAt: new Date(`${form.paidAt}T00:00:00`).toISOString(),
      notes: form.notes || undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full space-y-4"
      >
        <h2 className="font-display text-lg text-wine">
          {payout ? 'Editar repasse' : 'Novo repasse à ONG'}
        </h2>

        <Field label="Categoria">
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className={inputClass}
          >
            {PAYOUT_CATEGORY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {PAYOUT_CATEGORY_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Valor (R$)">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Data">
          <input
            required
            type="date"
            value={form.paidAt}
            onChange={(e) => setForm((f) => ({ ...f, paidAt: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Observação">
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
