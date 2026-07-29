import { STATUS_LABELS, STATUS_STYLES } from '../lib/bookingStatus';

export function StatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES.CANCELED}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
