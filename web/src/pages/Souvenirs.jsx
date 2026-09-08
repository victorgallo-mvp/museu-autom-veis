import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, formatDate, formatWeekday } from '../lib/format';
import { SouvenirSaleModal } from '../components/SouvenirSaleModal';
import { SouvenirModal } from '../components/SouvenirModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { downloadCsv } from '../lib/csv';

const TABS = [
  { value: 'sales', label: 'Vendas' },
  { value: 'products', label: 'Produtos' },
];

const iconButton =
  'p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors';
const primaryButton =
  'flex items-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors';
const secondaryButton =
  'flex items-center gap-2 bg-surface border border-border hover:bg-surface-hover text-text-primary font-medium px-4 py-2 rounded transition-colors disabled:opacity-50';

function errorMessage(error, fallback) {
  return error?.response?.data?.error ?? fallback;
}

function SalesTab({ souvenirs }) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, sale: null });
  const [saleToDelete, setSaleToDelete] = useState(null);

  const { data: sales, isLoading, isError } = useQuery({
    queryKey: ['souvenir-sales'],
    queryFn: async () => {
      const { data } = await api.get('/souvenir-sales');
      return data;
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['souvenir-sales'] });
    queryClient.invalidateQueries({ queryKey: ['souvenirs'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
  }

  const saleMutation = useMutation({
    mutationFn: (payload) =>
      modal.sale
        ? api.put(`/souvenir-sales/${modal.sale.id}`, payload)
        : api.post('/souvenir-sales', payload),
    onSuccess: () => {
      invalidateAll();
      toast.success(modal.sale ? 'Venda atualizada' : 'Venda registrada');
      setModal({ open: false, sale: null });
    },
    onError: (error) => toast.error(errorMessage(error, 'Erro ao salvar venda')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/souvenir-sales/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Venda excluída');
      setSaleToDelete(null);
    },
    onError: (error) => toast.error(errorMessage(error, 'Erro ao excluir venda')),
  });

  function handleExport() {
    const headers = [
      'Data',
      'Dia da semana',
      'Produto',
      'Quantidade',
      'Valor unitário',
      'Total recebido',
      'Comissão',
      'Repasse à ONG',
    ];
    const rows = (sales ?? []).map((sale) => [
      formatDate(sale.soldAt),
      formatWeekday(sale.soldAt),
      sale.souvenirName,
      sale.quantity,
      sale.unitPriceSnapshot,
      sale.total,
      sale.commissionTotal,
      sale.ownerShareTotal,
    ]);
    downloadCsv('vendas-de-souvenirs.csv', headers, rows);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
        <button
          type="button"
          onClick={handleExport}
          disabled={!sales || sales.length === 0}
          className={secondaryButton}
        >
          <Download size={18} />
          Exportar CSV
        </button>
        <button
          type="button"
          onClick={() => setModal({ open: true, sale: null })}
          className={primaryButton}
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
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium text-right">Qtd.</th>
                <th className="px-4 py-3 font-medium text-right">Valor unit.</th>
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
                    <span className="block text-xs text-text-secondary capitalize">
                      {formatWeekday(sale.soldAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {sale.souvenirName}
                    {sale.notes && (
                      <span className="block text-xs text-text-secondary">{sale.notes}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right">{sale.quantity}</td>
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
                        className={iconButton}
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

      <SouvenirSaleModal
        open={modal.open}
        sale={modal.sale}
        souvenirs={souvenirs.filter((s) => s.active)}
        submitting={saleMutation.isPending}
        onClose={() => setModal({ open: false, sale: null })}
        onSubmit={(payload) => saleMutation.mutate(payload)}
      />

      <ConfirmDialog
        open={Boolean(saleToDelete)}
        title="Excluir venda"
        description={
          saleToDelete
            ? `Tem certeza que deseja excluir a venda de ${saleToDelete.quantity}x ${saleToDelete.souvenirName}?`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setSaleToDelete(null)}
        onConfirm={() => deleteMutation.mutate(saleToDelete.id)}
      />
    </>
  );
}

function ProductsTab({ souvenirs, isLoading, isError }) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, souvenir: null });
  const [souvenirToDelete, setSouvenirToDelete] = useState(null);

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['souvenirs'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }

  const souvenirMutation = useMutation({
    mutationFn: (payload) =>
      modal.souvenir
        ? api.put(`/souvenirs/${modal.souvenir.id}`, payload)
        : api.post('/souvenirs', payload),
    onSuccess: () => {
      invalidateAll();
      toast.success(modal.souvenir ? 'Produto atualizado' : 'Produto criado');
      setModal({ open: false, souvenir: null });
    },
    onError: (error) => toast.error(errorMessage(error, 'Erro ao salvar produto')),
  });

  const toggleMutation = useMutation({
    mutationFn: (souvenir) =>
      api.put(`/souvenirs/${souvenir.id}`, {
        name: souvenir.name,
        price: souvenir.price,
        commission: souvenir.commission,
        active: !souvenir.active,
      }),
    onSuccess: (_, souvenir) => {
      invalidateAll();
      toast.success(souvenir.active ? 'Produto desativado' : 'Produto ativado');
    },
    onError: (error) => toast.error(errorMessage(error, 'Erro ao atualizar produto')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/souvenirs/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Produto excluído');
      setSouvenirToDelete(null);
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'Erro ao excluir produto'));
      setSouvenirToDelete(null);
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
        <button
          type="button"
          onClick={() => setModal({ open: true, souvenir: null })}
          className={primaryButton}
        >
          <Plus size={18} />
          Novo produto
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium text-right">Preço</th>
                <th className="px-4 py-3 font-medium text-right">Comissão</th>
                <th className="px-4 py-3 font-medium text-right">Repasse/un.</th>
                <th className="px-4 py-3 font-medium text-right">Vendas</th>
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
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
                    Erro ao carregar produtos.
                  </td>
                </tr>
              )}
              {souvenirs.length === 0 && !isLoading && !isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-text-secondary">
                    Nenhum produto cadastrado. Comece pelo boné.
                  </td>
                </tr>
              )}
              {souvenirs.map((souvenir) => (
                <tr
                  key={souvenir.id}
                  className={`border-b border-border last:border-0 hover:bg-surface-hover ${
                    souvenir.active ? '' : 'opacity-60'
                  }`}
                >
                  <td className="px-4 py-3 text-text-primary font-medium">{souvenir.name}</td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(souvenir.price)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(souvenir.commission)}
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right whitespace-nowrap">
                    {formatCurrency(souvenir.price - souvenir.commission)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-right">{souvenir.salesCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        souvenir.active
                          ? 'bg-success/20 text-success'
                          : 'bg-neutral/20 text-neutral'
                      }`}
                    >
                      {souvenir.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(souvenir)}
                        disabled={toggleMutation.isPending}
                        className={iconButton}
                        title={souvenir.active ? 'Desativar' : 'Ativar'}
                      >
                        {souvenir.active ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, souvenir })}
                        className={iconButton}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSouvenirToDelete(souvenir)}
                        disabled={souvenir.salesCount > 0}
                        className="p-1.5 rounded text-text-secondary hover:text-error hover:bg-surface transition-colors disabled:opacity-30 disabled:hover:text-text-secondary"
                        title={
                          souvenir.salesCount > 0
                            ? 'Produto com vendas não pode ser excluído. Desative-o.'
                            : 'Excluir'
                        }
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

      <SouvenirModal
        open={modal.open}
        souvenir={modal.souvenir}
        submitting={souvenirMutation.isPending}
        onClose={() => setModal({ open: false, souvenir: null })}
        onSubmit={(payload) => souvenirMutation.mutate(payload)}
      />

      <ConfirmDialog
        open={Boolean(souvenirToDelete)}
        title="Excluir produto"
        description={
          souvenirToDelete
            ? `Tem certeza que deseja excluir o produto "${souvenirToDelete.name}"?`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setSouvenirToDelete(null)}
        onConfirm={() => deleteMutation.mutate(souvenirToDelete.id)}
      />
    </>
  );
}

export default function Souvenirs() {
  const [tab, setTab] = useState('sales');

  const { data: souvenirs, isLoading, isError } = useQuery({
    queryKey: ['souvenirs', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/souvenirs', { params: { includeInactive: 1 } });
      return data;
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-wine">Souvenirs</h1>
        <div className="flex items-center gap-1 bg-surface border border-border rounded p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                tab === value
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'sales' ? (
        <SalesTab souvenirs={souvenirs ?? []} />
      ) : (
        <ProductsTab souvenirs={souvenirs ?? []} isLoading={isLoading} isError={isError} />
      )}
    </div>
  );
}
