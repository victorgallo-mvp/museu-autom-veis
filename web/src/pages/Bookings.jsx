import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';
import { STATUS_LABELS, STATUS_OPTIONS } from '../lib/bookingStatus';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { downloadCsv } from '../lib/csv';

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function StatusSelect({ status, onChange, disabled }) {
  return (
    <select
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((value) => (
        <option key={value} value={value}>
          {STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}

export default function Bookings() {
  const queryClient = useQueryClient();

  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [bookingToDelete, setBookingToDelete] = useState(null);

  const filters = {
    status: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    search: debouncedSearch || undefined,
  };

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const { data } = await api.get('/bookings', { params: filters });
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Agendamento excluido');
      setBookingToDelete(null);
    },
    onError: () => toast.error('Erro ao excluir agendamento'),
  });

  function toggleStatus(value) {
    setSelectedStatuses((current) =>
      current.includes(value) ? current.filter((s) => s !== value) : [...current, value]
    );
  }

  function handleExport() {
    const headers = [
      'Data e hora',
      'Grupo',
      'Responsavel',
      'Telefone',
      'Qtd prevista',
      'Qtd real',
      'Valor total',
      'Status',
    ];
    const rows = (bookings ?? []).map((booking) => [
      formatDateTime(booking.scheduledAt),
      booking.groupName,
      booking.responsibleName,
      booking.responsiblePhone,
      booking.expectedPeopleCount,
      booking.actualPeopleCount ?? '',
      booking.total,
      STATUS_LABELS[booking.status],
    ]);
    downloadCsv('agendamentos.csv', headers, rows);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-text-primary">Agendamentos</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={!bookings || bookings.length === 0}
            className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-hover text-text-primary font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <Link
            to="/bookings/new"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors"
          >
            <Plus size={18} />
            Novo agendamento
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por grupo ou responsavel"
            className="bg-background border border-border rounded pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent w-64"
          />
        </div>

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

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleStatus(value)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                selectedStatuses.includes(value)
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Data e hora</th>
                <th className="px-4 py-3 font-medium">Grupo</th>
                <th className="px-4 py-3 font-medium">Responsavel</th>
                <th className="px-4 py-3 font-medium text-right">Pessoas</th>
                <th className="px-4 py-3 font-medium text-right">Valor total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-text-secondary">
                    Carregando...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-error">
                    Erro ao carregar agendamentos.
                  </td>
                </tr>
              )}
              {bookings && bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-text-secondary">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              )}
              {bookings?.map((booking) => (
                <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                    {formatDateTime(booking.scheduledAt)}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{booking.groupName}</td>
                  <td className="px-4 py-3 text-text-secondary">{booking.responsibleName}</td>
                  <td className="px-4 py-3 text-text-primary text-right">
                    {booking.expectedPeopleCount}
                    {booking.actualPeopleCount !== null &&
                      booking.actualPeopleCount !== booking.expectedPeopleCount && (
                        <span className="text-text-secondary text-xs block">
                          real: {booking.actualPeopleCount}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(booking.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      status={booking.status}
                      disabled={statusMutation.isPending}
                      onChange={(status) => statusMutation.mutate({ id: booking.id, status })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/bookings/${booking.id}/edit`}
                        className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setBookingToDelete(booking)}
                        className="p-1.5 rounded text-text-secondary hover:text-error hover:bg-surface transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(bookingToDelete)}
        title="Excluir agendamento"
        description={
          bookingToDelete
            ? `Tem certeza que deseja excluir o agendamento de "${bookingToDelete.groupName}"? Essa acao nao pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setBookingToDelete(null)}
        onConfirm={() => deleteMutation.mutate(bookingToDelete.id)}
      />
    </div>
  );
}
