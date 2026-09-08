import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';

export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'lastMonth', label: 'Mês anterior' },
  { value: 'allTime', label: 'Todo período' },
  { value: 'custom', label: 'Personalizado' },
];

export function computeRange(period, customRange) {
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
        from: customRange?.from
          ? startOfDay(new Date(`${customRange.from}T00:00:00`))
          : startOfMonth(now),
        to: customRange?.to ? endOfDay(new Date(`${customRange.to}T00:00:00`)) : endOfMonth(now),
      };
    case 'month':
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}
