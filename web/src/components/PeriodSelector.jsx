export function PeriodSelector({ options, period, onPeriodChange, customRange, onCustomRangeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={period}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {period === 'custom' && customRange && onCustomRangeChange && (
        <>
          <input
            type="date"
            value={customRange.from}
            onChange={(e) => onCustomRangeChange((r) => ({ ...r, from: e.target.value }))}
            className="bg-surface border border-border rounded px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <span className="text-text-secondary text-sm">ate</span>
          <input
            type="date"
            value={customRange.to}
            onChange={(e) => onCustomRangeChange((r) => ({ ...r, to: e.target.value }))}
            className="bg-surface border border-border rounded px-2 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </>
      )}
    </div>
  );
}
