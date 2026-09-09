import { formatCurrency, formatDate, formatDateTime } from './format';
import { formatBreakdown } from './visitPricing';
import { EVENT_TYPE_LABELS } from './photoSessionType';
import { PAYOUT_CATEGORY_LABELS } from './payoutCategory';

// Seções que o usuário pode incluir ou não no relatório enviado ao proprietário.
export const REPORT_SECTIONS = [
  { key: 'summary', label: 'Resumo geral' },
  { key: 'visits', label: 'Visitas' },
  { key: 'visitsList', label: 'Lista de visitas', parent: 'visits' },
  { key: 'cachaca', label: 'Cachaças' },
  { key: 'cachacaList', label: 'Lista de vendas de cachaça', parent: 'cachaca' },
  { key: 'souvenirs', label: 'Souvenirs' },
  { key: 'souvenirsList', label: 'Lista de vendas de souvenirs', parent: 'souvenirs' },
  { key: 'photos', label: 'Fotos' },
  { key: 'photosList', label: 'Lista de sessões de fotos', parent: 'photos' },
  { key: 'expenses', label: 'Despesas' },
  { key: 'payouts', label: 'Repasses à ONG' },
  { key: 'cashflow', label: 'Situação do caixa' },
];

export const DEFAULT_SECTIONS = Object.fromEntries(
  REPORT_SECTIONS.map(({ key }) => [key, !key.endsWith('List')])
);

export function isSectionOn(selected, key) {
  const section = REPORT_SECTIONS.find((s) => s.key === key);
  if (!section) return false;
  if (section.parent && !selected[section.parent]) return false;
  return Boolean(selected[key]);
}

export function periodLabel(period, { allTime = false } = {}) {
  if (allTime) return 'período completo';
  return `${formatDate(period.from)} a ${formatDate(period.to)}`;
}

// Linhas da situação do caixa por categoria (acumulado desde o início).
export function cashflowRows(cashflow) {
  const categories = [
    ['Visitas', cashflow.visits],
    ['Cachaça', cashflow.products],
    ['Souvenirs', cashflow.souvenirs],
    ['Fotos', cashflow.photos],
  ].filter(([, bucket]) => bucket);

  const categorized = categories.reduce((sum, [, b]) => sum + b.payouts, 0);
  const generalPayouts = Math.max(0, Math.round((cashflow.payouts - categorized) * 100) / 100);

  return { categories, generalPayouts };
}

// Monta o relatório em texto puro, no formato que fica bom no WhatsApp.
export function buildReportText(
  report,
  selected,
  { title = 'Garagem do Automóvel', allTime = false } = {}
) {
  const on = (key) => isSectionOn(selected, key);
  const lines = [];
  const money = formatCurrency;

  lines.push(`*${title}*`);
  lines.push(`Relatório ${allTime ? 'do' : 'de'} ${periodLabel(report.period, { allTime })}`);

  if (on('summary')) {
    const s = report.summary;
    lines.push('', '*Resumo geral*');
    lines.push(`• Faturamento: ${money(s.revenue)}`);
    lines.push(`• Comissões: ${money(s.commission)}`);
    lines.push(`• Arrecadação ONG (bruta): ${money(s.ownerShare)}`);
    lines.push(`• Despesas: ${money(s.expenses)}`);
    lines.push(`• Líquido para a ONG: ${money(s.net)}`);
    lines.push(`• Repassado no período: ${money(s.payouts)}`);
  }

  if (on('visits')) {
    const v = report.visits;
    lines.push('', '*Visitas*');
    lines.push(`• Grupos pagos: ${v.counts.paid} (${v.counts.visitCount} visitas)`);
    lines.push(`• Visitantes: ${v.totals.people} (${formatBreakdown(v.totals)})`);
    lines.push(`• Pagantes: ${v.totals.paying}`);
    lines.push(`• Receita: ${money(v.totals.revenue)}`);
    lines.push(`• Comissão guia: ${money(v.totals.guideCommission)}`);
    lines.push(`• Arrecadação ONG: ${money(v.totals.ownerShare)}`);
    lines.push(
      `• Grupos pendentes: ${v.counts.pending} · cancelados: ${v.counts.canceled} · que não compareceram: ${v.counts.noShow}`
    );
    if (on('visitsList') && v.bookings.length > 0) {
      lines.push('_Visitas do período:_');
      for (const b of v.bookings) {
        const status = b.status === 'NO_SHOW' ? ' · não compareceu' : '';
        lines.push(
          `- ${formatDateTime(b.scheduledAt)} · ${b.groupName} · ${b.counts.total} pessoas (${formatBreakdown(b.counts)}) · ${money(b.total)}${status}`
        );
      }
    }
  }

  if (on('cachaca')) {
    const c = report.cachaca;
    lines.push('', '*Cachaças*');
    lines.push(`• Garrafas vendidas: ${c.totals.bottles}`);
    lines.push(`• Receita: ${money(c.totals.revenue)}`);
    lines.push(`• Comissão: ${money(c.totals.commission)}`);
    lines.push(`• Arrecadação ONG: ${money(c.totals.ownerShare)}`);
    if (on('cachacaList') && c.sales.length > 0) {
      lines.push('_Vendas:_');
      for (const s of c.sales) {
        lines.push(`- ${formatDate(s.soldAt)} · ${s.bottleCount} garrafa(s) · ${money(s.total)}`);
      }
    }
  }

  if (on('souvenirs')) {
    const s = report.souvenirs;
    lines.push('', '*Souvenirs*');
    lines.push(`• Unidades vendidas: ${s.totals.units}`);
    lines.push(`• Receita: ${money(s.totals.revenue)}`);
    lines.push(`• Comissão: ${money(s.totals.commission)}`);
    lines.push(`• Arrecadação ONG: ${money(s.totals.ownerShare)}`);
    for (const p of s.byProduct) {
      lines.push(`  - ${p.name}: ${p.units} un. · ${money(p.revenue)}`);
    }
    if (on('souvenirsList') && s.sales.length > 0) {
      lines.push('_Vendas:_');
      for (const sale of s.sales) {
        lines.push(
          `- ${formatDate(sale.soldAt)} · ${sale.quantity}x ${sale.souvenirName} · ${money(sale.total)}`
        );
      }
    }
  }

  if (on('photos')) {
    const p = report.photos;
    lines.push('', '*Fotos*');
    lines.push(`• Sessões: ${p.totals.sessions}`);
    lines.push(`• Receita: ${money(p.totals.revenue)}`);
    lines.push(`• Comissão: ${money(p.totals.commission)}`);
    lines.push(`• Arrecadação ONG: ${money(p.totals.ownerShare)}`);
    if (on('photosList') && p.sessions.length > 0) {
      lines.push('_Sessões:_');
      for (const s of p.sessions) {
        lines.push(
          `- ${formatDate(s.sessionAt)} · ${EVENT_TYPE_LABELS[s.eventType] ?? s.eventType} · ${s.clientName} · ${money(s.amount)}`
        );
      }
    }
  }

  if (on('expenses')) {
    const e = report.expenses;
    lines.push('', '*Despesas*');
    lines.push(`• Total: ${money(e.total)}`);
    for (const item of e.items) {
      lines.push(`- ${formatDate(item.paidAt)} · ${item.description} · ${money(item.amount)}`);
    }
  }

  if (on('payouts')) {
    const p = report.payouts;
    lines.push('', '*Repasses à ONG*');
    lines.push(`• Total no período: ${money(p.total)}`);
    for (const item of p.items) {
      const label = PAYOUT_CATEGORY_LABELS[item.category] ?? item.category;
      lines.push(
        `- ${formatDate(item.paidAt)} · ${label}${item.notes ? ` · ${item.notes}` : ''} · ${money(item.amount)}`
      );
    }
  }

  if (on('cashflow')) {
    const c = report.cashflow;
    const { categories, generalPayouts } = cashflowRows(c);
    lines.push('', '*Situação do caixa (acumulado desde o início)*');
    for (const [label, b] of categories) {
      lines.push(
        `• ${label}: arrecadado ${money(b.accrued)} · repassado ${money(b.payouts)} · pendente ${money(b.pending)}`
      );
    }
    if (generalPayouts > 0) {
      lines.push(`• Repasses lançados como "Geral" (sem categoria): ${money(generalPayouts)}`);
    }
    lines.push(`• Total repassado à ONG: ${money(c.payouts)}`);
    lines.push(`• Total de despesas: ${money(c.expenses)}`);
    lines.push(`• Saldo em caixa: ${money(c.balance)}`);
    lines.push(
      '_Arrecadado = parte da ONG (receita menos comissões). Pendente = arrecadado menos o repassado da categoria e menos a parte proporcional dos repasses gerais._'
    );
  }

  lines.push('', `_Gerado em ${formatDateTime(report.generatedAt)}_`);

  return lines.join('\n');
}
