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
import {
  Users,
  Wallet,
  HandCoins,
  Landmark,
  Receipt,
  Clock3,
  MapPinned,
  Boxes,
  ClipboardCheck,
  BottleWine,
  Camera,
} from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { PeriodSelector } from '../components/PeriodSelector';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês anterior' },
  { value: 'allTime', label: 'Todo período' },
  { value: 'custom', label: 'Personalizado' },
];

const FORECAST_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'all', label: 'Todas agendadas' },
];

const UPCOMING_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
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
    case 'allTime':
      return { from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) };
    case 'custom':
      return {
        from: customRange.from
          ? startOfDay(new Date(`${customRange.from}T00:00:00`))
          : startOfMonth(now),
        to: customRange.to ? endOfDay(new Date(`${customRange.to}T00:00:00`)) : endOfMonth(now),
      };
    case 'month':
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

function computeForecastRange(preset) {
  const now = new Date();

  switch (preset) {
    case '7d':
      return { from: now, to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) };
    case '14d':
      return { from: now, to: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) };
    case 'month':
      return { from: now, to: endOfMonth(now) };
    case 'all':
    default:
      return { from: now, to: undefined };
  }
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`border rounded-lg p-5 h-full flex flex-col ${
        highlight ? 'bg-accent/10 border-accent' : 'bg-surface border-border'
      }`}
    >
      <div className="flex items-start gap-2 text-text-secondary text-sm mb-2">
        <Icon size={16} className="shrink-0 mt-0.5" />
        <span>{label}</span>
      </div>
      <p
        className={`font-display text-2xl mt-auto ${highlight ? 'text-accent' : 'text-text-primary'}`}
      >
        {value}
      </p>
    </div>
  );
}

function BookingList({ title, bookings, emptyLabel, extra }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-wine">{title}</h2>
        {extra}
      </div>
      {bookings.length === 0 ? (
        <p className="text-text-secondary text-sm">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border">
          {bookings.map((booking) => (
            <li key={booking.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-text-primary text-sm font-medium">{booking.groupName}</p>
                <p className="text-text-secondary text-xs">
                  {formatDateTime(booking.scheduledAt)} - {booking.expectedPeopleCount} pessoas
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

function SectionHeading({ children }) {
  return (
    <h2 className="font-display text-xl text-wine mb-4 mt-10 first:mt-0">{children}</h2>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [forecastPeriod, setForecastPeriod] = useState('7d');
  const [upcomingDays, setUpcomingDays] = useState('7');

  const range = useMemo(() => computeRange(period, customRange), [period, customRange]);
  const forecastRange = useMemo(() => computeForecastRange(forecastPeriod), [forecastPeriod]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'dashboard-summary',
      range.from.toISOString(),
      range.to.toISOString(),
      upcomingDays,
    ],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/summary', {
        params: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          upcomingDays,
        },
      });
      return data;
    },
  });

  const { data: forecast, isLoading: loadingForecast } = useQuery({
    queryKey: [
      'dashboard-forecast',
      forecastRange.from.toISOString(),
      forecastRange.to?.toISOString(),
    ],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/forecast', {
        params: {
          from: forecastRange.from.toISOString(),
          to: forecastRange.to?.toISOString(),
        },
      });
      return data;
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-wine">Dashboard</h1>
        <PeriodSelector
          options={PERIOD_OPTIONS}
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
          <SectionHeading>Resumo Geral</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Wallet}
              label="Faturamento total"
              value={formatCurrency(
                data.visits.totals.revenue +
                  data.products.totals.revenue +
                  data.photos.totals.revenue
              )}
            />
            <StatCard
              icon={HandCoins}
              label="Comissão total"
              value={formatCurrency(
                data.visits.totals.guideCommission +
                  data.products.totals.commission +
                  data.photos.totals.commission
              )}
            />
            <StatCard icon={Receipt} label="Despesas" value={formatCurrency(data.expenses)} />
            <StatCard
              icon={Landmark}
              label="Arrecadação ONG"
              value={formatCurrency(
                data.visits.totals.revenue +
                  data.products.totals.revenue +
                  data.photos.totals.revenue -
                  (data.visits.totals.guideCommission +
                    data.products.totals.commission +
                    data.photos.totals.commission) -
                  data.expenses
              )}
            />
          </div>

          <SectionHeading>Resumo Visitas</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Users} label="Nr. visitantes" value={data.visits.totals.people} />
            <StatCard icon={Boxes} label="Nr. grupos" value={data.visits.counts.paid} />
            <StatCard
              icon={MapPinned}
              label="Nr. visitas"
              value={data.visits.counts.visitCount}
            />
            <StatCard
              icon={Wallet}
              label="Receita total"
              value={formatCurrency(data.visits.totals.revenue)}
            />
            <StatCard
              icon={HandCoins}
              label="Comissão guia"
              value={formatCurrency(data.visits.totals.guideCommission)}
            />
            <StatCard
              icon={Landmark}
              label="Arrecadação ONG"
              value={formatCurrency(data.visits.totals.ownerShare)}
            />
          </div>

          <SectionHeading>Resumo Cachaças</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BottleWine}
              label="Garrafas vendidas"
              value={data.products.totals.bottles}
            />
            <StatCard
              icon={Wallet}
              label="Receita total"
              value={formatCurrency(data.products.totals.revenue)}
            />
            <StatCard
              icon={HandCoins}
              label="Comissão guia"
              value={formatCurrency(data.products.totals.commission)}
            />
            <StatCard
              icon={Landmark}
              label="Arrecadação ONG"
              value={formatCurrency(data.products.totals.ownerShare)}
            />
          </div>

          <SectionHeading>Resumo Fotos</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Camera}
              label="Sessões realizadas"
              value={data.photos.totals.sessions}
            />
            <StatCard
              icon={Wallet}
              label="Receita total"
              value={formatCurrency(data.photos.totals.revenue)}
            />
            <StatCard
              icon={HandCoins}
              label="Comissão"
              value={formatCurrency(data.photos.totals.commission)}
            />
            <StatCard
              icon={Landmark}
              label="Arrecadação ONG"
              value={formatCurrency(data.photos.totals.ownerShare)}
            />
          </div>

          <SectionHeading>Faturamento Previsto</SectionHeading>
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 text-warning">
                <Clock3 size={18} />
                <h3 className="font-display text-lg text-wine">Visitas agendadas (pendentes)</h3>
              </div>
              <PeriodSelector
                options={FORECAST_OPTIONS}
                period={forecastPeriod}
                onPeriodChange={setForecastPeriod}
              />
            </div>
            {loadingForecast || !forecast ? (
              <p className="text-text-secondary text-sm">Carregando...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Pessoas previstas</p>
                  <p className="text-text-primary text-lg">{forecast.people}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Receita prevista</p>
                  <p className="text-text-primary text-lg">{formatCurrency(forecast.revenue)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Comissão prevista</p>
                  <p className="text-text-primary text-lg">
                    {formatCurrency(forecast.guideCommission)}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Arrecadação ONG prevista</p>
                  <p className="text-text-primary text-lg">
                    {formatCurrency(forecast.ownerShare)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <SectionHeading>Previsto x realizado</SectionHeading>
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4 text-text-primary">
              <ClipboardCheck size={18} />
              <h3 className="font-display text-lg text-wine">
                Previsto x realizado (período selecionado)
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Pessoas previstas</p>
                <p className="text-text-primary text-lg">{data.visits.attendance.expected}</p>
              </div>
              <div>
                <p className="text-text-secondary">Pessoas que compareceram</p>
                <p className="text-text-primary text-lg">{data.visits.attendance.actual}</p>
              </div>
              <div>
                <p className="text-text-secondary">Diferença</p>
                <p className="text-text-primary text-lg">
                  {data.visits.attendance.actual - data.visits.attendance.expected}
                </p>
              </div>
            </div>
          </div>

          <SectionHeading>Próximas visitas</SectionHeading>
          <BookingList
            title={`Próximos ${upcomingDays} dias`}
            bookings={data.visits.upcoming}
            emptyLabel="Nenhuma visita no período."
            extra={
              <PeriodSelector
                options={UPCOMING_OPTIONS}
                period={upcomingDays}
                onPeriodChange={setUpcomingDays}
              />
            }
          />
        </>
      )}
    </div>
  );
}
