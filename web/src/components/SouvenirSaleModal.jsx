import { useEffect, useState } from 'react';
import { formatCurrency, round2 } from '../lib/format';

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

const EMPTY_FORM = { soldAt: '', souvenirId: '', quantity: '', notes: '' };

export function SouvenirSaleModal({ open, sale, souvenirs, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        sale
          ? {
              soldAt: sale.soldAt.slice(0, 10),
              souvenirId: sale.souvenirId,
              quantity: sale.quantity,
              notes: sale.notes ?? '',
            }
          : { ...EMPTY_FORM, souvenirId: souvenirs?.[0]?.id ?? '' }
      );
    }
  }, [open, sale, souvenirs]);

  if (!open) return null;

  // Ao editar, o produto da venda pode estar inativo: mantém ele na lista.
  const options = [...(souvenirs ?? [])];
  if (sale && !options.some((s) => s.id === sale.souvenirId)) {
    options.push({
      id: sale.souvenirId,
      name: `${sale.souvenirName} (inativo)`,
      price: sale.unitPriceSnapshot,
      commission: sale.commissionSnapshot,
    });
  }

  const selected = options.find((s) => s.id === form.souvenirId);
  const quantity = Number(form.quantity) || 0;
  // Ao editar sem trocar o produto, o preço usado é o congelado na venda.
  const unitPrice =
    sale && sale.souvenirId === form.souvenirId ? sale.unitPriceSnapshot : (selected?.price ?? 0);
  const unitCommission =
    sale && sale.souvenirId === form.souvenirId
      ? sale.commissionSnapshot
      : (selected?.commission ?? 0);
  const total = round2(quantity * unitPrice);
  const commission = round2(quantity * unitCommission);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      souvenirId: form.souvenirId,
      soldAt: new Date(`${form.soldAt}T00:00:00`).toISOString(),
      quantity: Number(form.quantity),
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
          {sale ? 'Editar venda' : 'Nova venda de souvenir'}
        </h2>

        {options.length === 0 ? (
          <p className="text-sm text-text-secondary">
            Cadastre um produto na aba Produtos antes de registrar vendas.
          </p>
        ) : (
          <>
            <Field label="Produto">
              <select
                required
                value={form.souvenirId}
                onChange={(e) => setForm((f) => ({ ...f, souvenirId: e.target.value }))}
                className={inputClass}
              >
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {formatCurrency(s.price)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data da venda">
              <input
                required
                type="date"
                value={form.soldAt}
                onChange={(e) => setForm((f) => ({ ...f, soldAt: e.target.value }))}
                className={inputClass}
              />
            </Field>

            <Field label="Quantidade">
              <input
                required
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
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

            <div className="bg-background border border-border rounded-lg p-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-text-secondary text-xs">Total</p>
                <p className="text-text-primary">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Comissão</p>
                <p className="text-text-primary">{formatCurrency(commission)}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Repasse ONG</p>
                <p className="text-text-primary">{formatCurrency(round2(total - commission))}</p>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-text-secondary hover:bg-surface-hover transition-colors"
          >
            Cancelar
          </button>
          {options.length > 0 && (
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
