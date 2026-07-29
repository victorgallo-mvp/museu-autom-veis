import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

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

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ticketPrice: '', guideCommissionPerPerson: '' });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ticketPrice: settings.ticketPrice,
        guideCommissionPerPerson: settings.guideCommissionPerPerson,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (payload) => api.put('/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configuracoes atualizadas');
    },
    onError: () => toast.error('Erro ao salvar configuracoes'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      ticketPrice: Number(form.ticketPrice),
      guideCommissionPerPerson: Number(form.guideCommissionPerPerson),
    });
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-text-primary mb-6">Configuracoes</h1>

      <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          Alteracoes aqui afetam apenas agendamentos criados dali em diante. Agendamentos ja
          existentes mantem os valores gravados no momento em que foram criados.
        </p>
      </div>

      {isLoading ? (
        <p className="text-text-secondary">Carregando...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-lg p-6 space-y-4"
        >
          <Field label="Preco do ingresso (R$ por pessoa)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.ticketPrice}
              onChange={(e) => setForm((f) => ({ ...f, ticketPrice: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <Field label="Comissao do guia (R$ por pessoa)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.guideCommissionPerPerson}
              onChange={(e) =>
                setForm((f) => ({ ...f, guideCommissionPerPerson: e.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
