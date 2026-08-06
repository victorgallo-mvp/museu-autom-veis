import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';
import { downloadCsv } from '../lib/csv';
import { PeriodSelector } from '../components/PeriodSelector';

const TYPE_LABELS = {
  visit: 'Visita',
  product: 'Cachaça',
  expense: 'Despesa',
  payout: 'Repasse',
};

const TYPE_OPTIONS = Object.keys(TYPE_LABELS);

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '14d', label: '14 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
];

function computeRange(period, customRange) {
  const now = new Date();

  switch (period) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case '7d':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case '14d':
      return { from: startOfDay(subDays(now, 13)), to: endOfDay(now) };
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

export default function CashflowHistory() {
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [selectedTypes, setSelectedTypes] = useState([]);

  const range = useMemo(() => computeRange(period, customRange), [period, customRange]);

  const { data: history, isLoading, isError } = useQuery({
    queryKey: ['cashflow-history', range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data } = await api.get('/cashflow/history', {
        params: { from: range.from.toISOString(), to: range.to.toISOString() },
      });
      return data;
    },
  });

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (selectedTypes.length === 0) return history;
    return history.filter((event) => selectedTypes.includes(event.type));
  }, [history, selectedTypes]);

  function toggleType(value) {
    setSelectedTypes((current) =>
      current.includes(value) ? current.filter((t) => t !== value) : [...current, value]
    );
  }

  function handleExport() {
    const headers = ['Data', 'Tipo', 'Descrição', 'Direção', 'Valor'];
    const rows = filteredHistory.map((event) => [
      formatDateTime(event.date),
      TYPE_LABELS[event.type] ?? event.type,
      event.description,
      event.direction === 'in' ? 'Entrada' : 'Saída',
      event.amount,
    ]);
    downloadCsv('fluxo-de-caixa-historico.csv', headers, rows);
  }

  return (
    <div>
      <Link
        to="/cashflow"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para fluxo de caixa
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-wine">Histórico de movimentações</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={filteredHistory.length === 0}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <PeriodSelector
          options={PERIOD_OPTIONS}
          period={period}
          onPeriodChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />

        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleType(value)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                selectedTypes.includes(value)
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {TYPE_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                    Carregando...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-error">
                    Erro ao carregar histórico.
                  </td>
                </tr>
              )}
              {filteredHistory.length === 0 && !isLoading && !isError && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
              {filteredHistory.map((event, index) => (
                <tr
                  key={index}
                  className="border-b border-border last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                    {formatDateTime(event.date)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{TYPE_LABELS[event.type]}</td>
                  <td className="px-4 py-3 text-text-primary">{event.description}</td>
                  <td
                    className={`px-4 py-3 text-right whitespace-nowrap ${
                      event.direction === 'in' ? 'text-success' : 'text-error'
                    }`}
                  >
                    {event.direction === 'in' ? '+' : '-'} {formatCurrency(event.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
