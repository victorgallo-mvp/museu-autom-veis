import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';
import { downloadCsv } from '../lib/csv';

const TYPE_LABELS = {
  visit: 'Visita',
  product: 'Cachaca',
  expense: 'Despesa',
  payout: 'Repasse',
};

export default function CashflowHistory() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filters = { from: dateFrom || undefined, to: dateTo || undefined };

  const { data: history, isLoading, isError } = useQuery({
    queryKey: ['cashflow-history', filters],
    queryFn: async () => {
      const { data } = await api.get('/cashflow/history', { params: filters });
      return data;
    },
  });

  function handleExport() {
    const headers = ['Data', 'Tipo', 'Descricao', 'Direcao', 'Valor'];
    const rows = (history ?? []).map((event) => [
      formatDateTime(event.date),
      TYPE_LABELS[event.type] ?? event.type,
      event.description,
      event.direction === 'in' ? 'Entrada' : 'Saida',
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
        <h1 className="font-display text-3xl text-text-primary">Historico de movimentacoes</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={!history || history.length === 0}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-background border border-border rounded px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
        <span className="text-text-secondary text-sm">ate</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-background border border-border rounded px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Descricao</th>
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
                    Erro ao carregar historico.
                  </td>
                </tr>
              )}
              {history && history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-secondary">
                    Nenhuma movimentacao encontrada.
                  </td>
                </tr>
              )}
              {history?.map((event, index) => (
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
