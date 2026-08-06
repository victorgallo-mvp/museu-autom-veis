import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, Receipt, HandCoins, Plus, Pencil, Trash2, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/format';
import { ExpenseModal } from '../components/ExpenseModal';
import { PayoutModal } from '../components/PayoutModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PAYOUT_CATEGORY_LABELS } from '../lib/payoutCategory';

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`border rounded-lg p-5 ${
        highlight ? 'bg-accent/10 border-accent' : 'bg-surface border-border'
      }`}
    >
      <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <p className={`font-display text-2xl ${highlight ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

export default function CashFlow() {
  const queryClient = useQueryClient();

  const [expenseModal, setExpenseModal] = useState({ open: false, expense: null });
  const [payoutModal, setPayoutModal] = useState({ open: false, payout: null });
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [payoutToDelete, setPayoutToDelete] = useState(null);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['cashflow-summary'],
    queryFn: async () => {
      const { data } = await api.get('/cashflow/summary');
      return data;
    },
  });

  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data } = await api.get('/expenses');
      return data;
    },
  });

  const { data: payouts, isLoading: loadingPayouts } = useQuery({
    queryKey: ['payouts'],
    queryFn: async () => {
      const { data } = await api.get('/payouts');
      return data;
    },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['payouts'] });
  }

  const expenseMutation = useMutation({
    mutationFn: (payload) =>
      expenseModal.expense
        ? api.put(`/expenses/${expenseModal.expense.id}`, payload)
        : api.post('/expenses', payload),
    onSuccess: () => {
      invalidateAll();
      toast.success(expenseModal.expense ? 'Despesa atualizada' : 'Despesa criada');
      setExpenseModal({ open: false, expense: null });
    },
    onError: () => toast.error('Erro ao salvar despesa'),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Despesa excluída');
      setExpenseToDelete(null);
    },
    onError: () => toast.error('Erro ao excluir despesa'),
  });

  const payoutMutation = useMutation({
    mutationFn: (payload) =>
      payoutModal.payout
        ? api.put(`/payouts/${payoutModal.payout.id}`, payload)
        : api.post('/payouts', payload),
    onSuccess: () => {
      invalidateAll();
      toast.success(payoutModal.payout ? 'Repasse atualizado' : 'Repasse registrado');
      setPayoutModal({ open: false, payout: null });
    },
    onError: () => toast.error('Erro ao salvar repasse'),
  });

  const deletePayoutMutation = useMutation({
    mutationFn: (id) => api.delete(`/payouts/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Repasse excluído');
      setPayoutToDelete(null);
    },
    onError: () => toast.error('Erro ao excluir repasse'),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl text-wine">Fluxo de Caixa</h1>
        <Link
          to="/cashflow/history"
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ScrollText size={16} />
          Ver histórico completo
        </Link>
      </div>

      {loadingSummary ? (
        <p className="text-text-secondary mb-8">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Wallet}
            label="Saldo em caixa"
            value={formatCurrency(summary.totals.balance)}
          />
          <StatCard
            icon={Receipt}
            label="Despesas"
            value={formatCurrency(summary.totals.expenses)}
          />
          <StatCard
            icon={HandCoins}
            label="Repassado à ONG (total)"
            value={formatCurrency(summary.totals.payouts)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-wine">Despesas</h2>
            <button
              type="button"
              onClick={() => setExpenseModal({ open: true, expense: null })}
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <Plus size={16} />
              Nova despesa
            </button>
          </div>

          {loadingExpenses && <p className="text-text-secondary text-sm">Carregando...</p>}
          {expenses && expenses.length === 0 && (
            <p className="text-text-secondary text-sm">Nenhuma despesa registrada.</p>
          )}
          {expenses && expenses.length > 0 && (
            <ul className="divide-y divide-border">
              {expenses.map((expense) => (
                <li key={expense.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-text-primary text-sm font-medium">
                      {expense.description}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {formatDateTime(expense.paidAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-primary text-sm whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpenseModal({ open: true, expense })}
                      className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(expense)}
                      className="p-1.5 rounded text-text-secondary hover:text-error hover:bg-surface-hover transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-wine">Repasses à ONG</h2>
            <button
              type="button"
              onClick={() => setPayoutModal({ open: true, payout: null })}
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <Plus size={16} />
              Novo repasse
            </button>
          </div>

          {loadingPayouts && <p className="text-text-secondary text-sm">Carregando...</p>}
          {payouts && payouts.length === 0 && (
            <p className="text-text-secondary text-sm">Nenhum repasse registrado.</p>
          )}
          {payouts && payouts.length > 0 && (
            <ul className="divide-y divide-border">
              {payouts.map((payout) => (
                <li key={payout.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-text-primary text-sm font-medium">
                      {payout.notes || 'Repasse à ONG'}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {formatDateTime(payout.paidAt)} - {PAYOUT_CATEGORY_LABELS[payout.category]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-primary text-sm whitespace-nowrap">
                      {formatCurrency(payout.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPayoutModal({ open: true, payout })}
                      className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                      title="Editar"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutToDelete(payout)}
                      className="p-1.5 rounded text-text-secondary hover:text-error hover:bg-surface-hover transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ExpenseModal
        open={expenseModal.open}
        expense={expenseModal.expense}
        submitting={expenseMutation.isPending}
        onClose={() => setExpenseModal({ open: false, expense: null })}
        onSubmit={(payload) => expenseMutation.mutate(payload)}
      />

      <PayoutModal
        open={payoutModal.open}
        payout={payoutModal.payout}
        submitting={payoutMutation.isPending}
        onClose={() => setPayoutModal({ open: false, payout: null })}
        onSubmit={(payload) => payoutMutation.mutate(payload)}
      />

      <ConfirmDialog
        open={Boolean(expenseToDelete)}
        title="Excluir despesa"
        description={
          expenseToDelete
            ? `Tem certeza que deseja excluir a despesa "${expenseToDelete.description}"?`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={() => deleteExpenseMutation.mutate(expenseToDelete.id)}
      />

      <ConfirmDialog
        open={Boolean(payoutToDelete)}
        title="Excluir repasse"
        description={
          payoutToDelete
            ? `Tem certeza que deseja excluir o repasse de ${formatCurrency(payoutToDelete.amount)}?`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setPayoutToDelete(null)}
        onConfirm={() => deletePayoutMutation.mutate(payoutToDelete.id)}
      />
    </div>
  );
}
