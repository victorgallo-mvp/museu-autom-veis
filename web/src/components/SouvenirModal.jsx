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

const EMPTY_FORM = { name: '', price: '', commission: '', active: true };

export function SouvenirModal({ open, souvenir, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        souvenir
          ? {
              name: souvenir.name,
              price: souvenir.price,
              commission: souvenir.commission,
              active: souvenir.active,
            }
          : EMPTY_FORM
      );
    }
  }, [open, souvenir]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      name: form.name.trim(),
      price: Number(form.price),
      commission: Number(form.commission) || 0,
      active: form.active,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-lg p-6 max-w-sm w-full space-y-4"
      >
        <h2 className="font-display text-lg text-wine">
          {souvenir ? 'Editar produto' : 'Novo produto'}
        </h2>

        <Field label="Nome do produto">
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex.: Boné, Caneca, Chaveiro"
            className={inputClass}
          />
        </Field>

        <Field label="Preço de venda (R$ por unidade)">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="Comissão (R$ por unidade)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.commission}
            onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
            placeholder="0,00"
            className={inputClass}
          />
        </Field>

        {souvenir && (
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="accent-accent"
            />
            Produto ativo (aparece ao registrar vendas)
          </label>
        )}

        <p className="text-xs text-text-secondary">
          Alterar preço ou comissão afeta apenas vendas registradas dali em diante.
        </p>

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
