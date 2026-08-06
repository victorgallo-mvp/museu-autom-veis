export const STATUS_LABELS = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

export const STATUS_STYLES = {
  PENDING: 'bg-warning/20 text-warning',
  PAID: 'bg-success/20 text-success',
  CANCELED: 'bg-neutral/20 text-neutral',
  NO_SHOW: 'bg-error/20 text-error',
};

export const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
