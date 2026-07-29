import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value ?? 0
  );
}

export function formatDateTime(date) {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}
