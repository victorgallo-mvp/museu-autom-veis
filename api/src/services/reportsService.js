const prisma = require('../lib/prisma');
const { round2, halfPriceOf } = require('../lib/money');
const settingsService = require('./settingsService');
const dashboardService = require('./dashboardService');
const cashflowService = require('./cashflowService');
const { serializeBooking } = require('./bookingsService');
const { serializeSale } = require('./cachacaSalesService');
const { serializeSouvenirSale } = require('./souvenirSalesService');
const { serializeSession } = require('./photoSessionsService');
const { serializeExpense } = require('./expensesService');
const { serializePayout } = require('./payoutsService');

function defaultPeriod() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

function sumAmounts(items) {
  return round2(items.reduce((sum, item) => sum + item.amount, 0));
}

// Junta tudo que o proprietário pode querer ver num período: totais (via
// dashboard), listas detalhadas de cada módulo e a situação geral do caixa.
async function getReport({ from, to }) {
  const period = { from: from || defaultPeriod().from, to: to || defaultPeriod().to };
  const inPeriod = { gte: period.from, lte: period.to };

  const [settings, summary, cashflow, bookings, cachacaSales, souvenirSales, sessions, expenses, payouts] =
    await Promise.all([
      settingsService.getSettings(),
      dashboardService.getSummary({ from: period.from, to: period.to, upcomingDays: 1 }),
      cashflowService.getSummary(),
      prisma.booking.findMany({
        where: { scheduledAt: inPeriod, status: { in: ['PAID', 'NO_SHOW'] } },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.cachacaSale.findMany({ where: { soldAt: inPeriod }, orderBy: { soldAt: 'asc' } }),
      prisma.souvenirSale.findMany({ where: { soldAt: inPeriod }, orderBy: { soldAt: 'asc' } }),
      prisma.photoSession.findMany({ where: { sessionAt: inPeriod }, orderBy: { sessionAt: 'asc' } }),
      prisma.expense.findMany({ where: { paidAt: inPeriod }, orderBy: { paidAt: 'asc' } }),
      prisma.payout.findMany({ where: { paidAt: inPeriod }, orderBy: { paidAt: 'asc' } }),
    ]);

  const expenseItems = expenses.map(serializeExpense);
  const payoutItems = payouts.map(serializePayout);

  const payoutsByCategory = { VISITS: 0, PRODUCTS: 0, SOUVENIRS: 0, PHOTOS: 0, GENERAL: 0 };
  for (const payout of payoutItems) {
    payoutsByCategory[payout.category] = round2(payoutsByCategory[payout.category] + payout.amount);
  }

  const revenue = round2(
    summary.visits.totals.revenue +
      summary.products.totals.revenue +
      summary.souvenirs.totals.revenue +
      summary.photos.totals.revenue
  );
  const commission = round2(
    summary.visits.totals.guideCommission +
      summary.products.totals.commission +
      summary.souvenirs.totals.commission +
      summary.photos.totals.commission
  );
  const ownerShare = round2(revenue - commission);
  const expensesTotal = summary.expenses;
  const payoutsTotal = sumAmounts(payoutItems);

  return {
    period,
    generatedAt: new Date(),
    settings: {
      ticketPrice: settings.ticketPrice,
      halfTicketPrice: halfPriceOf(settings.ticketPrice),
      guideCommissionPerPerson: settings.guideCommissionPerPerson,
    },
    summary: {
      revenue,
      commission,
      ownerShare,
      expenses: expensesTotal,
      net: round2(ownerShare - expensesTotal),
      payouts: payoutsTotal,
    },
    visits: {
      counts: summary.visits.counts,
      totals: summary.visits.totals,
      attendance: summary.visits.attendance,
      bookings: bookings.map(serializeBooking),
    },
    cachaca: {
      totals: summary.products.totals,
      sales: cachacaSales.map(serializeSale),
    },
    souvenirs: {
      totals: summary.souvenirs.totals,
      byProduct: summary.souvenirs.byProduct,
      sales: souvenirSales.map(serializeSouvenirSale),
    },
    photos: {
      totals: summary.photos.totals,
      sessions: sessions.map(serializeSession),
    },
    expenses: {
      total: expensesTotal,
      items: expenseItems,
    },
    payouts: {
      total: payoutsTotal,
      byCategory: payoutsByCategory,
      items: payoutItems,
    },
    cashflow: cashflow.totals,
  };
}

module.exports = { getReport };
