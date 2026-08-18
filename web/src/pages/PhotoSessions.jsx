import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { EVENT_TYPE_LABELS } from '../lib/photoSessionType';
import { PhotoSessionModal } from '../components/PhotoSessionModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { downloadCsv } from '../lib/csv';

export default function PhotoSessions() {
  const queryClient = useQueryClient();

  const [modal, setModal] = useState({ open: false, session: null });
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const { data: sessions, isLoading, isError } = useQuery({
    queryKey: ['photo-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/photo-sessions');
      return data;
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['photo-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
  }

  const sessionMutation = useMutation({
    mutationFn: (payload) =>
      modal.session
        ? api.put(`/photo-sessions/${modal.session.id}`, payload)
        : api.post('/photo-sessions', payload),
    onSuccess: () => {
      invalidateAll();
      toast.success(modal.session ? 'Sessão atualizada' : 'Sessão registrada');
      setModal({ open: false, session: null });
    },
    onError: () => toast.error('Erro ao salvar sessão'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/photo-sessions/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Sessão excluída');
      setSessionToDelete(null);
    },
    onError: () => toast.error('Erro ao excluir sessão'),
  });

  function handleExport() {
    const headers = [
      'Data',
      'Cliente',
      'Telefone',
      'Tipo de evento',
      'Valor recebido',
      'Comissão',
      'Repasse à ONG',
    ];
    const rows = (sessions ?? []).map((session) => [
      formatDate(session.sessionAt),
      session.clientName,
      session.clientPhone,
      EVENT_TYPE_LABELS[session.eventType],
      session.amount,
      session.commission,
      session.ownerShareTotal,
    ]);
    downloadCsv('sessoes-de-fotos.csv', headers, rows);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-wine">Fotos</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={!sessions || sessions.length === 0}
            className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-hover text-text-primary font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => setModal({ open: true, session: null })}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors"
          >
            <Plus size={18} />
            Nova sessão
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">Valor recebido</th>
                <th className="px-4 py-3 font-medium text-right">Comissão</th>
                <th className="px-4 py-3 font-medium text-right">Repasse à ONG</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-text-secondary">
                    Carregando...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-error">
                    Erro ao carregar sessões.
                  </td>
                </tr>
              )}
              {sessions && sessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-text-secondary">
                    Nenhuma sessão registrada.
                  </td>
                </tr>
              )}
              {sessions?.map((session) => (
                <tr key={session.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                    {formatDate(session.sessionAt)}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{session.clientName}</td>
                  <td className="px-4 py-3 text-text-secondary">{session.clientPhone}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {EVENT_TYPE_LABELS[session.eventType]}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(session.amount)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(session.commission)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(session.ownerShareTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, session })}
                        className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionToDelete(session)}
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

      <PhotoSessionModal
        open={modal.open}
        session={modal.session}
        submitting={sessionMutation.isPending}
        onClose={() => setModal({ open: false, session: null })}
        onSubmit={(payload) => sessionMutation.mutate(payload)}
      />

      <ConfirmDialog
        open={Boolean(sessionToDelete)}
        title="Excluir sessão"
        description={
          sessionToDelete
            ? `Tem certeza que deseja excluir a sessão de "${sessionToDelete.clientName}"?`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setSessionToDelete(null)}
        onConfirm={() => deleteMutation.mutate(sessionToDelete.id)}
      />
    </div>
  );
}
