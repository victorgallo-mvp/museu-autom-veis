import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, MessageCircle, Printer, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { formatCurrency, formatDate, formatDateTime } from '../lib/format';
import { formatBreakdown } from '../lib/visitPricing';
import { EVENT_TYPE_LABELS } from '../lib/photoSessionType';
import { PAYOUT_CATEGORY_LABELS } from '../lib/payoutCategory';
import { PeriodSelector } from '../components/PeriodSelector';
import { PERIOD_OPTIONS, computeRange } from '../lib/period';
import {
  REPORT_SECTIONS,
  DEFAULT_SECTIONS,
  isSectionOn,
  buildReportText,
  periodLabel,
  ongTotals,
} from '../lib/report';

const STORAGE_KEY = 'report-sections';
const REPORT_TITLE = 'Garagem do Automóvel';

function loadSelection() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return stored && typeof stored === 'object' ? { ...DEFAULT_SECTIONS, ...stored } : DEFAULT_SECTIONS;
  } catch {
    return DEFAULT_SECTIONS;
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  }
}

function Section({ title, children }) {
  return (
    <section className="report-section">
      <h3 className="font-display text-lg text-wine border-b border-border pb-1 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Rows({ items }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-text-secondary">{label}</dt>
          <dd className="text-text-primary text-right whitespace-nowrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function List({ columns, rows, empty = 'Nenhum registro no período.' }) {
  if (rows.length === 0) {
    return <p className="text-xs text-text-secondary mt-3">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-text-secondary border-b border-border">
            {columns.map((c) => (
              <th key={c} className={`py-1 pr-3 font-medium ${c === columns.at(-1) ? 'text-right' : ''}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-1 pr-3 text-text-primary ${j === row.length - 1 ? 'text-right whitespace-nowrap' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportPreview({ report, selected, allTime }) {
  const on = (key) => isSectionOn(selected, key);
  const money = formatCurrency;
  const s = report.summary;
  const v = report.visits;
  const c = report.cachaca;
  const sv = report.souvenirs;
  const p = report.photos;
  const cf = report.cashflow;

  return (
    <div className="print-area bg-surface border border-border rounded-lg p-6 sm:p-8 space-y-6">
      <header>
        <h2 className="font-display text-2xl text-wine">{REPORT_TITLE}</h2>
        <p className="text-sm text-text-secondary">
          Relatório {allTime ? 'do' : 'de'} {periodLabel(report.period, { allTime })}
        </p>
      </header>

      {on('summary') && (
        <Section title="Resumo geral">
          <Rows
            items={[
              ['Faturamento', money(s.revenue)],
              ['Comissões', money(s.commission)],
              ['Arrecadação ONG (bruta)', money(s.ownerShare)],
              ['Despesas', money(s.expenses)],
              ['Líquido para a ONG', money(s.net)],
              ['Repassado no período', money(s.payouts)],
            ]}
          />
        </Section>
      )}

      {on('visits') && (
        <Section title="Visitas">
          <Rows
            items={[
              ['Grupos pagos', `${v.counts.paid} (${v.counts.visitCount} visitas)`],
              ['Visitantes', `${v.totals.people} (${formatBreakdown(v.totals)})`],
              ['Pagantes', v.totals.paying],
              ['Receita', money(v.totals.revenue)],
              ['Comissão guia', money(v.totals.guideCommission)],
              ['Arrecadação ONG', money(v.totals.ownerShare)],
              ['Grupos pendentes', v.counts.pending],
              ['Grupos cancelados', v.counts.canceled],
              ['Grupos que não compareceram', v.counts.noShow],
            ]}
          />
          {on('visitsList') && (
            <List
              columns={['Data', 'Grupo', 'Pessoas', 'Valor']}
              rows={v.bookings.map((b) => [
                formatDateTime(b.scheduledAt),
                b.status === 'NO_SHOW' ? `${b.groupName} (não compareceu)` : b.groupName,
                `${b.counts.total} (${formatBreakdown(b.counts)})`,
                money(b.total),
              ])}
            />
          )}
        </Section>
      )}

      {on('cachaca') && (
        <Section title="Cachaças">
          <Rows
            items={[
              ['Garrafas vendidas', c.totals.bottles],
              ['Receita', money(c.totals.revenue)],
              ['Comissão', money(c.totals.commission)],
              ['Arrecadação ONG', money(c.totals.ownerShare)],
            ]}
          />
          {on('cachacaList') && (
            <List
              columns={['Data', 'Garrafas', 'Valor']}
              rows={c.sales.map((sale) => [formatDate(sale.soldAt), sale.bottleCount, money(sale.total)])}
            />
          )}
        </Section>
      )}

      {on('souvenirs') && (
        <Section title="Souvenirs">
          <Rows
            items={[
              ['Unidades vendidas', sv.totals.units],
              ['Receita', money(sv.totals.revenue)],
              ['Comissão', money(sv.totals.commission)],
              ['Arrecadação ONG', money(sv.totals.ownerShare)],
              ...sv.byProduct.map((item) => [`— ${item.name}`, `${item.units} un. · ${money(item.revenue)}`]),
            ]}
          />
          {on('souvenirsList') && (
            <List
              columns={['Data', 'Produto', 'Qtd.', 'Valor']}
              rows={sv.sales.map((sale) => [
                formatDate(sale.soldAt),
                sale.souvenirName,
                sale.quantity,
                money(sale.total),
              ])}
            />
          )}
        </Section>
      )}

      {on('photos') && (
        <Section title="Fotos">
          <Rows
            items={[
              ['Sessões', p.totals.sessions],
              ['Receita', money(p.totals.revenue)],
              ['Comissão', money(p.totals.commission)],
              ['Arrecadação ONG', money(p.totals.ownerShare)],
            ]}
          />
          {on('photosList') && (
            <List
              columns={['Data', 'Tipo', 'Cliente', 'Valor']}
              rows={p.sessions.map((session) => [
                formatDate(session.sessionAt),
                EVENT_TYPE_LABELS[session.eventType] ?? session.eventType,
                session.clientName,
                money(session.amount),
              ])}
            />
          )}
        </Section>
      )}

      {on('expenses') && (
        <Section title="Despesas">
          <Rows items={[['Total no período', money(report.expenses.total)]]} />
          <List
            columns={['Data', 'Descrição', 'Valor']}
            rows={report.expenses.items.map((item) => [
              formatDate(item.paidAt),
              item.description,
              money(item.amount),
            ])}
          />
        </Section>
      )}

      {on('payouts') && (
        <Section title="Repasses à ONG">
          <Rows items={[['Total no período', money(report.payouts.total)]]} />
          <List
            columns={['Data', 'Categoria', 'Observação', 'Valor']}
            rows={report.payouts.items.map((item) => [
              formatDate(item.paidAt),
              PAYOUT_CATEGORY_LABELS[item.category] ?? item.category,
              item.notes ?? '',
              money(item.amount),
            ])}
          />
        </Section>
      )}

      {on('cashflow') && (
        <Section title="Situação do caixa (acumulado desde o início)">
          <Rows
            items={[
              ['Arrecadado para a ONG', money(ongTotals(cf).accrued)],
              ['Despesas pagas pelo caixa', money(ongTotals(cf).expenses)],
              ['Já repassado', money(ongTotals(cf).payouts)],
              ['Pendente de repasse (saldo em caixa)', money(ongTotals(cf).pending)],
            ]}
          />
        </Section>
      )}

      <p className="text-xs text-text-secondary">Gerado em {formatDateTime(report.generatedAt)}</p>
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [selected, setSelected] = useState(loadSelection);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      // armazenamento indisponível: segue sem persistir
    }
  }, [selected]);

  const range = useMemo(() => computeRange(period, customRange), [period, customRange]);

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const { data } = await api.get('/reports', {
        params: { from: range.from.toISOString(), to: range.to.toISOString() },
      });
      return data;
    },
  });

  const allTime = period === 'allTime';

  const text = useMemo(
    () => (report ? buildReportText(report, selected, { title: REPORT_TITLE, allTime }) : ''),
    [report, selected, allTime]
  );

  function toggle(key) {
    setSelected((current) => ({ ...current, [key]: !current[key] }));
  }

  function setAll(value) {
    setSelected(Object.fromEntries(REPORT_SECTIONS.map(({ key }) => [key, value])));
  }

  async function handleCopy() {
    const ok = await copyToClipboard(text);
    if (ok) toast.success('Relatório copiado');
    else toast.error('Não foi possível copiar');
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  function handlePrint() {
    window.print();
  }

  const nothingSelected = !REPORT_SECTIONS.some(({ key }) => isSectionOn(selected, key));

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl text-wine">Relatório</h1>
        <PeriodSelector
          options={PERIOD_OPTIONS}
          period={period}
          onPeriodChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <aside className="no-print bg-surface border border-border rounded-lg p-4 space-y-4 lg:sticky lg:top-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                O que enviar
              </h2>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={() => setAll(true)} className="text-accent hover:underline">
                  Tudo
                </button>
                <button type="button" onClick={() => setAll(false)} className="text-text-secondary hover:underline">
                  Nada
                </button>
              </div>
            </div>
            <ul className="space-y-1">
              {REPORT_SECTIONS.map(({ key, label, parent }) => {
                const disabled = parent ? !selected[parent] : false;
                const checked = Boolean(selected[key]);
                return (
                  <li key={key} className={parent ? 'pl-5' : ''}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(key)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
                        disabled
                          ? 'text-text-secondary/50 cursor-not-allowed'
                          : 'text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      {checked && !disabled ? (
                        <CheckSquare size={16} className="text-accent shrink-0" />
                      ) : (
                        <Square size={16} className="shrink-0" />
                      )}
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={!report || nothingSelected}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-background font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              <MessageCircle size={18} />
              Enviar no WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!report || nothingSelected}
              className="w-full flex items-center justify-center gap-2 bg-surface border border-border hover:bg-surface-hover text-text-primary font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              <Copy size={18} />
              Copiar texto
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!report || nothingSelected}
              className="w-full flex items-center justify-center gap-2 bg-surface border border-border hover:bg-surface-hover text-text-primary font-medium px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              <Printer size={18} />
              Imprimir / salvar PDF
            </button>
            <p className="text-xs text-text-secondary">
              O WhatsApp abre com o texto pronto; basta escolher o contato. Para PDF, use a opção
              "Salvar como PDF" na janela de impressão.
            </p>
          </div>
        </aside>

        <div>
          {isLoading && <p className="text-text-secondary">Montando relatório...</p>}
          {isError && <p className="text-error">Erro ao montar o relatório.</p>}
          {report && nothingSelected && (
            <p className="no-print text-text-secondary text-sm">
              Selecione ao menos uma seção para montar o relatório.
            </p>
          )}
          {report && !nothingSelected && (
            <ReportPreview report={report} selected={selected} allTime={allTime} />
          )}
        </div>
      </div>
    </div>
  );
}
