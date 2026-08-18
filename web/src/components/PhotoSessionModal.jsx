import { useEffect, useState } from 'react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_OPTIONS } from '../lib/photoSessionType';

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

const EMPTY_FORM = {
  clientName: '',
  clientPhone: '',
  eventType: 'WEDDING',
  sessionAt: '',
  amount: '',
  commission: '',
  notes: '',
};

export function PhotoSessionModal({ open, session, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        session
          ? {
              clientName: session.clientName,
              clientPhone: session.clientPhone,
              eventType: session.eventType,
              sessionAt: session.sessionAt.slice(0, 10),
              amount: session.amount,
              commission: session.commission,
              notes: session.notes ?? '',
            }
          : EMPTY_FORM
      );
    }
  }, [open, session]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      eventType: form.eventType,
      sessionAt: new Date(`${form.sessionAt}T00:00:00`).toISOString(),
      amount: Number(form.amount),
      commission: Number(form.commission || 0),
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
          {session ? 'Editar sessão de fotos' : 'Nova sessão de fotos'}
        </h2>

        <Field label="Cliente">
          <input
            required
            type="text"
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Telefone">
          <input
            required
            type="text"
            value={form.clientPhone}
            onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Tipo de evento">
          <select
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            className={inputClass}
          >
            {EVENT_TYPE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {EVENT_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Data da sessão">
          <input
            required
            type="date"
            value={form.sessionAt}
            onChange={(e) => setForm((f) => ({ ...f, sessionAt: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Valor recebido (R$)">
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

        <Field label="Comissão (R$)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.commission}
            onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
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
