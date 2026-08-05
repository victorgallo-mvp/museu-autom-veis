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

export function formatDate(date) {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatWeekday(date) {
  return format(new Date(date), 'EEEE', { locale: ptBR });
}

export function toDatetimeLocal(date) {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}

export function round2(value) {
  return Math.round(value * 100) / 100;
}
