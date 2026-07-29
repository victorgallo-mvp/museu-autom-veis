import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, round2, toDatetimeLocal } from '../lib/format';
import { formatPhone, unmaskPhone } from '../lib/phone';
import { STATUS_LABELS, STATUS_OPTIONS } from '../lib/bookingStatus';

const EMPTY_FORM = {
  groupName: '',
  responsibleName: '',
  responsiblePhone: '',
  scheduledAt: '',
  peopleCount: 1,
  notes: '',
  status: 'PENDING',
};

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

export default function BookingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [prices, setPrices] = useState({ ticketPrice: 0, guideCommissionPerPerson: 0 });

  const { data: booking, isLoading: loadingBooking } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${id}`);
      return data;
    },
    enabled: isEdit,
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
    enabled: !isEdit,
  });

  useEffect(() => {
    if (isEdit && booking) {
      setForm({
        groupName: booking.groupName,
        responsibleName: booking.responsibleName,
        responsiblePhone: formatPhone(booking.responsiblePhone),
        scheduledAt: toDatetimeLocal(booking.scheduledAt),
        peopleCount: booking.peopleCount,
        notes: booking.notes ?? '',
        status: booking.status,
      });
      setPrices({
        ticketPrice: booking.ticketPriceSnapshot,
        guideCommissionPerPerson: booking.guideCommissionSnapshot,
      });
    }
  }, [isEdit, booking]);

  useEffect(() => {
    if (!isEdit && settings) {
      setPrices({
        ticketPrice: settings.ticketPrice,
        guideCommissionPerPerson: settings.guideCommissionPerPerson,
      });
    }
  }, [isEdit, settings]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? api.put(`/bookings/${id}`, payload) : api.post('/bookings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success(isEdit ? 'Agendamento atualizado' : 'Agendamento criado');
      navigate('/bookings');
    },
    onError: () => toast.error('Erro ao salvar agendamento'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      groupName: form.groupName,
      responsibleName: form.responsibleName,
      responsiblePhone: unmaskPhone(form.responsiblePhone),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      peopleCount: Number(form.peopleCount),
      notes: form.notes || undefined,
      status: form.status,
    });
  }

  const peopleCount = Number(form.peopleCount) || 0;
  const total = round2(peopleCount * Number(prices.ticketPrice));
  const guideCommissionTotal = round2(peopleCount * Number(prices.guideCommissionPerPerson));
  const ownerShareTotal = round2(total - guideCommissionTotal);

  const loading = isEdit ? loadingBooking : loadingSettings;

  return (
    <div className="max-w-2xl">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para agendamentos
      </Link>

      <h1 className="font-display text-3xl text-text-primary mb-6">
        {isEdit ? 'Editar agendamento' : 'Novo agendamento'}
      </h1>

      {loading ? (
        <p className="text-text-secondary">Carregando...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-lg p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome do grupo">
              <input
                required
                value={form.groupName}
                onChange={(e) => setForm((f) => ({ ...f, groupName: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Nome do responsavel">
              <input
                required
                value={form.responsibleName}
                onChange={(e) => setForm((f) => ({ ...f, responsibleName: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Telefone">
              <input
                required
                value={form.responsiblePhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsiblePhone: formatPhone(e.target.value) }))
                }
                placeholder="(37) 99999-0000"
                className={inputClass}
              />
            </Field>
            <Field label="Data e hora">
              <input
                required
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Quantidade de pessoas">
              <input
                required
                type="number"
                min="1"
                value={form.peopleCount}
                onChange={(e) => setForm((f) => ({ ...f, peopleCount: e.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Observacoes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <div className="bg-background border border-border rounded-lg p-4">
            <h2 className="text-sm text-text-secondary mb-3">Resumo</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Valor total</p>
                <p className="text-text-primary text-lg">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Comissao do guia</p>
                <p className="text-text-primary text-lg">{formatCurrency(guideCommissionTotal)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Repasse ao dono</p>
                <p className="text-text-primary text-lg">{formatCurrency(ownerShareTotal)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/bookings"
              className="px-4 py-2 rounded text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              Cancelar
            </Link>
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
