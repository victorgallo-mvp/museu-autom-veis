import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { Users, Wallet, HandCoins, Landmark, Clock3 } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes passado' },
  { value: 'custom', label: 'Personalizado' },
];

function computeRange(period, customRange) {
  const now = new Date();

  switch (period) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case 'custom':
      return {
        from: customRange.from ? startOfDay(new Date(customRange.from)) : startOfMonth(now),
        to: customRange.to ? endOfDay(new Date(customRange.to)) : endOfMonth(now),
      };
    case 'month':
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <p className="font-display text-2xl text-text-primary">{value}</p>
    </div>
  );
}

function PeriodSelector({ period, onPeriodChange, customRange, onCustomRangeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
      >
        {PERIOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {period === 'custom' && (
        <>
          <input
            type="date"
            value={customRange.from}
            onChange={(e) => onCustomRangeChange((r) => ({ ...r, from: e.target.value }))}
            className="bg-surface border border-border rounded px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <span className="text-text-secondary text-sm">ate</span>
          <input
            type="date"
            value={customRange.to}
            onChange={(e) => onCustomRangeChange((r) => ({ ...r, to: e.target.value }))}
            className="bg-surface border border-border rounded px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </>
      )}
    </div>
  );
}

function BookingList({ title, bookings, emptyLabel }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="font-display text-lg text-text-primary mb-4">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-text-secondary text-sm">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border">
          {bookings.map((booking) => (
            <li key={booking.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-text-primary text-sm font-medium">{booking.groupName}</p>
                <p className="text-text-secondary text-xs">
                  {formatDateTime(booking.scheduledAt)} - {booking.peopleCount} pessoas
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  const range = useMemo(() => computeRange(period, customRange), [period, customRange]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary', range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary', {
        params: { from: range.from.toISOString(), to: range.to.toISOString() },
      });
      return data;
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-text-primary">Dashboard</h1>
        <PeriodSelector
          period={period}
          onPeriodChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {isLoading && <p className="text-text-secondary">Carregando...</p>}
      {isError && <p className="text-error">Erro ao carregar o dashboard.</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Visitas pagas" value={data.counts.paid} />
            <StatCard icon={Wallet} label="Receita" value={formatCurrency(data.totals.revenue)} />
            <StatCard
              icon={HandCoins}
              label="Comissao do guia"
              value={formatCurrency(data.totals.guideCommission)}
            />
            <StatCard
              icon={Landmark}
              label="Repasse ao dono"
              value={formatCurrency(data.totals.ownerShare)}
            />
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4 text-warning">
              <Clock3 size={18} />
              <h2 className="font-display text-lg text-text-primary">Previsto (pendentes futuros)</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Pessoas</p>
                <p className="text-text-primary text-lg">{data.forecast.people}</p>
              </div>
              <div>
                <p className="text-text-secondary">Receita prevista</p>
                <p className="text-text-primary text-lg">{formatCurrency(data.forecast.revenue)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Comissao prevista</p>
                <p className="text-text-primary text-lg">
                  {formatCurrency(data.forecast.guideCommission)}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Repasse previsto</p>
                <p className="text-text-primary text-lg">{formatCurrency(data.forecast.ownerShare)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BookingList
              title="Proximas visitas (7 dias)"
              bookings={data.upcoming}
              emptyLabel="Nenhuma visita nos proximos 7 dias."
            />
            <BookingList
              title="Ultimas alteracoes"
              bookings={data.recent}
              emptyLabel="Nenhum agendamento ainda."
            />
          </div>
        </>
      )}
    </div>
  );
}
