import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, formatDate, formatWeekday } from '../lib/format';
import { CachacaSaleModal } from '../components/CachacaSaleModal';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function CachacaSales() {
  const queryClient = useQueryClient();

  const [modal, setModal] = useState({ open: false, sale: null });
  const [saleToDelete, setSaleToDelete] = useState(null);

  const { data: sales, isLoading, isError } = useQuery({
    queryKey: ['cachaca-sales'],
    queryFn: async () => {
      const { data } = await api.get('/cachaca-sales');
      return data;
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['cachaca-sales'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
  }

  const saleMutation = useMutation({
    mutationFn: (payload) =>
      modal.sale ? api.put(`/cachaca-sales/${modal.sale.id}`, payload) : api.post('/cachaca-sales', payload),
    onSuccess: () => {
      invalidateAll();
      toast.success(modal.sale ? 'Venda atualizada' : 'Venda registrada');
      setModal({ open: false, sale: null });
    },
    onError: () => toast.error('Erro ao salvar venda'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/cachaca-sales/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Venda excluída');
      setSaleToDelete(null);
    },
    onError: () => toast.error('Erro ao excluir venda'),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-wine">Cachaças</h1>
        <button
          type="button"
          onClick={() => setModal({ open: true, sale: null })}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors"
        >
          <Plus size={18} />
          Nova venda
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Dia da semana</th>
                <th className="px-4 py-3 font-medium text-right">Garrafas</th>
                <th className="px-4 py-3 font-medium text-right">Valor/garrafa</th>
                <th className="px-4 py-3 font-medium text-right">Total recebido</th>
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
                    Erro ao carregar vendas.
                  </td>
                </tr>
              )}
              {sales && sales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-text-secondary">
                    Nenhuma venda registrada.
                  </td>
                </tr>
              )}
              {sales?.map((sale) => (
                <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-3 text-text-primary whitespace-nowrap">
                    {formatDate(sale.soldAt)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">
                    {formatWeekday(sale.soldAt)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right">{sale.bottleCount}</td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(sale.unitPriceSnapshot)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(sale.commissionTotal)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(sale.ownerShareTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, sale })}
                        className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSaleToDelete(sale)}
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

      <CachacaSaleModal
        open={modal.open}
        sale={modal.sale}
        submitting={saleMutation.isPending}
        onClose={() => setModal({ open: false, sale: null })}
        onSubmit={(payload) => saleMutation.mutate(payload)}
      />

      <ConfirmDialog
        open={Boolean(saleToDelete)}
        title="Excluir venda"
        description={
          saleToDelete
            ? `Tem certeza que deseja excluir a venda de ${saleToDelete.bottleCount} garrafa(s)?`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setSaleToDelete(null)}
        onConfirm={() => deleteMutation.mutate(saleToDelete.id)}
      />
    </div>
  );
}
