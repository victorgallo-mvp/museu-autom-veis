import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, toDatetimeLocal } from '../lib/format';
import { formatPhone, unmaskPhone } from '../lib/phone';
import { STATUS_LABELS, STATUS_OPTIONS } from '../lib/bookingStatus';
import { calcVisitTotals } from '../lib/visitPricing';

const EMPTY_FORM = {
  groupName: '',
  responsibleName: '',
  responsiblePhone: '',
  scheduledAt: '',
  expectedAdults: 1,
  expectedChildrenHalf: 0,
  expectedChildrenFree: 0,
  actualAdults: '',
  actualChildrenHalf: '',
  actualChildrenFree: '',
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

function toCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// Três campos de contagem (adultos, crianças 7-12, crianças até 6).
function CountFields({ title, prefix, form, setForm, disabled, placeholders }) {
  const fields = [
    { key: 'Adults', label: 'Adultos (13+)' },
    { key: 'ChildrenHalf', label: 'Crianças 7 a 12 (meia)' },
    { key: 'ChildrenFree', label: 'Crianças até 6 (grátis)' },
  ];

  const total = fields.reduce((sum, { key }) => sum + toCount(form[`${prefix}${key}`]), 0);

  return (
    <div className="sm:col-span-2 bg-background border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm text-text-secondary">{title}</h2>
        <span className="text-sm text-text-primary">
          Total: <strong>{total}</strong>
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {fields.map(({ key, label }) => {
          const name = `${prefix}${key}`;
          return (
            <Field key={name} label={label}>
              <input
                type="number"
                min="0"
                disabled={disabled}
                placeholder={placeholders ? String(placeholders[key] ?? 0) : undefined}
                value={form[name]}
                onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                className={`${inputClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </Field>
          );
        })}
      </div>
    </div>
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
        expectedAdults: booking.expectedAdults,
        expectedChildrenHalf: booking.expectedChildrenHalf,
        expectedChildrenFree: booking.expectedChildrenFree,
        actualAdults: booking.actualAdults ?? '',
        actualChildrenHalf: booking.actualChildrenHalf ?? '',
        actualChildrenFree: booking.actualChildrenFree ?? '',
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
    onError: (error) =>
      toast.error(error?.response?.data?.error ?? 'Erro ao salvar agendamento'),
  });

  const expected = {
    adults: toCount(form.expectedAdults),
    childrenHalf: toCount(form.expectedChildrenHalf),
    childrenFree: toCount(form.expectedChildrenFree),
  };
  const expectedTotal = expected.adults + expected.childrenHalf + expected.childrenFree;

  const actualFilled =
    form.actualAdults !== '' || form.actualChildrenHalf !== '' || form.actualChildrenFree !== '';
  const actual = {
    adults: toCount(form.actualAdults),
    childrenHalf: toCount(form.actualChildrenHalf),
    childrenFree: toCount(form.actualChildrenFree),
  };

  function handleStatusChange(status) {
    setForm((f) => {
      const next = { ...f, status };
      // Ao marcar como pago, pré-preenche a contagem real com a prevista.
      if (status === 'PAID' && !actualFilled) {
        next.actualAdults = expected.adults;
        next.actualChildrenHalf = expected.childrenHalf;
        next.actualChildrenFree = expected.childrenFree;
      }
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (expectedTotal < 1) {
      toast.error('Informe pelo menos uma pessoa na quantidade prevista');
      return;
    }

    let actualPayload = {};
    if (form.status === 'NO_SHOW') {
      actualPayload = { actualPeopleCount: 0, actualChildrenHalf: 0, actualChildrenFree: 0 };
    } else if (form.status === 'PAID') {
      const source = actualFilled ? actual : expected;
      actualPayload = {
        actualPeopleCount: source.adults + source.childrenHalf + source.childrenFree,
        actualChildrenHalf: source.childrenHalf,
        actualChildrenFree: source.childrenFree,
      };
    }

    mutation.mutate({
      groupName: form.groupName,
      responsibleName: form.responsibleName,
      responsiblePhone: unmaskPhone(form.responsiblePhone),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      expectedPeopleCount: expectedTotal,
      expectedChildrenHalf: expected.childrenHalf,
      expectedChildrenFree: expected.childrenFree,
      ...actualPayload,
      notes: form.notes || undefined,
      status: form.status,
    });
  }

  const effective =
    form.status === 'NO_SHOW'
      ? { adults: 0, childrenHalf: 0, childrenFree: 0 }
      : form.status === 'PAID' && actualFilled
        ? actual
        : expected;

  const { total, guideCommissionTotal, ownerShareTotal, halfPrice, payingCount } =
    calcVisitTotals(effective, prices.ticketPrice, prices.guideCommissionPerPerson);

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

      <h1 className="font-display text-3xl text-wine mb-6">
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
            <Field label="Nome do responsável">
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

            <CountFields
              title="Quantidade prevista"
              prefix="expected"
              form={form}
              setForm={setForm}
            />

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </Field>

            {form.status === 'PAID' && (
              <CountFields
                title="Quantidade real (quem de fato compareceu)"
                prefix="actual"
                form={form}
                setForm={setForm}
                placeholders={{
                  Adults: expected.adults,
                  ChildrenHalf: expected.childrenHalf,
                  ChildrenFree: expected.childrenFree,
                }}
              />
            )}

            {form.status === 'NO_SHOW' && (
              <Field label="Quantidade real">
                <input
                  disabled
                  value={0}
                  className={`${inputClass} opacity-50 cursor-not-allowed`}
                />
              </Field>
            )}
          </div>

          <Field label="Observações">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputClass}
            />
          </Field>

          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm text-text-secondary">Resumo</h2>
              <p className="text-xs text-text-secondary">
                Inteira {formatCurrency(prices.ticketPrice)} · Meia {formatCurrency(halfPrice)} ·{' '}
                {payingCount} pagante{payingCount === 1 ? '' : 's'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Valor total</p>
                <p className="text-text-primary text-lg">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Comissão guia</p>
                <p className="text-text-primary text-lg">{formatCurrency(guideCommissionTotal)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Repasse à ONG</p>
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
