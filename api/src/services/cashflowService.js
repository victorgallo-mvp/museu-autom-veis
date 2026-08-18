const prisma = require('../lib/prisma');
const { calcTotals, round2 } = require('../lib/money');
const { serializeExpense } = require('./expensesService');
const { serializePayout } = require('./payoutsService');
const { serializeBooking } = require('./bookingsService');
const { serializeSale } = require('./cachacaSalesService');
const { serializeSession } = require('./photoSessionsService');

const RECENT_LIMIT = 10;

function sumOwnerShare(items, getArgs) {
  return round2(
    items.reduce((sum, item) => {
      const { count, unitPrice, commission } = getArgs(item);
      const { ownerShareTotal } = calcTotals(count, unitPrice, commission);
      return sum + ownerShareTotal;
    }, 0)
  );
}

async function getAccrued() {
  const [paidBookings, sales, sessions] = await Promise.all([
    prisma.booking.findMany({ where: { status: 'PAID' } }),
    prisma.cachacaSale.findMany(),
    prisma.photoSession.findMany(),
  ]);

  const visitsAccrued = sumOwnerShare(paidBookings, (booking) => ({
    count: booking.actualPeopleCount ?? booking.expectedPeopleCount,
    unitPrice: Number(booking.ticketPriceSnapshot),
    commission: Number(booking.guideCommissionSnapshot),
  }));

  const productsAccrued = sumOwnerShare(sales, (sale) => ({
    count: sale.bottleCount,
    unitPrice: Number(sale.unitPriceSnapshot),
    commission: Number(sale.commissionSnapshot),
  }));

  const photosAccrued = sumOwnerShare(sessions, (session) => ({
    count: 1,
    unitPrice: Number(session.amount),
    commission: Number(session.commission),
  }));

  return { visitsAccrued, productsAccrued, photosAccrued };
}

async function getSummary() {
  const [{ visitsAccrued, productsAccrued, photosAccrued }, expenses, payouts] = await Promise.all([
    getAccrued(),
    prisma.expense.findMany(),
    prisma.payout.findMany(),
  ]);

  const expensesTotal = round2(expenses.reduce((sum, e) => sum + Number(e.amount), 0));

  const payoutsByCategory = { VISITS: 0, PRODUCTS: 0, PHOTOS: 0, GENERAL: 0 };
  for (const payout of payouts) {
    payoutsByCategory[payout.category] += Number(payout.amount);
  }
  const visitsPayouts = round2(payoutsByCategory.VISITS);
  const productsPayouts = round2(payoutsByCategory.PRODUCTS);
  const photosPayouts = round2(payoutsByCategory.PHOTOS);
  const generalPayouts = round2(payoutsByCategory.GENERAL);
  const payoutsTotal = round2(visitsPayouts + productsPayouts + photosPayouts + generalPayouts);

  const accruedSum = visitsAccrued + productsAccrued + photosAccrued;
  const visitsRatio = accruedSum > 0 ? visitsAccrued / accruedSum : 0;
  const productsRatio = accruedSum > 0 ? productsAccrued / accruedSum : 0;
  const photosRatio = accruedSum > 0 ? photosAccrued / accruedSum : 0;

  const pendingVisits = round2(visitsAccrued - visitsPayouts - generalPayouts * visitsRatio);
  const pendingProducts = round2(productsAccrued - productsPayouts - generalPayouts * productsRatio);
  const pendingPhotos = round2(photosAccrued - photosPayouts - generalPayouts * photosRatio);

  const balance = round2(accruedSum - expensesTotal - payoutsTotal);

  const [recentExpenses, recentPayouts] = await Promise.all([
    prisma.expense.findMany({ orderBy: { paidAt: 'desc' }, take: RECENT_LIMIT }),
    prisma.payout.findMany({ orderBy: { paidAt: 'desc' }, take: RECENT_LIMIT }),
  ]);

  return {
    totals: {
      visits: { accrued: visitsAccrued, payouts: visitsPayouts, pending: pendingVisits },
      products: { accrued: productsAccrued, payouts: productsPayouts, pending: pendingProducts },
      photos: { accrued: photosAccrued, payouts: photosPayouts, pending: pendingPhotos },
      expenses: expensesTotal,
      payouts: payoutsTotal,
      balance,
    },
    recentExpenses: recentExpenses.map(serializeExpense),
    recentPayouts: recentPayouts.map(serializePayout),
  };
}

async function getHistory({ from, to }) {
  const dateFilter = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lte = to;
  const hasFilter = Boolean(from || to);

  const [paidBookings, sales, sessions, expenses, payouts] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'PAID', ...(hasFilter ? { scheduledAt: dateFilter } : {}) },
    }),
    prisma.cachacaSale.findMany({
      where: hasFilter ? { soldAt: dateFilter } : {},
    }),
    prisma.photoSession.findMany({
      where: hasFilter ? { sessionAt: dateFilter } : {},
    }),
    prisma.expense.findMany({
      where: hasFilter ? { paidAt: dateFilter } : {},
    }),
    prisma.payout.findMany({
      where: hasFilter ? { paidAt: dateFilter } : {},
    }),
  ]);

  const events = [];

  for (const booking of paidBookings) {
    const b = serializeBooking(booking);
    events.push({
      type: 'visit',
      date: booking.scheduledAt,
      description: `Visita paga - ${b.groupName}`,
      amount: b.ownerShareTotal,
      direction: 'in',
    });
  }

  for (const sale of sales) {
    const s = serializeSale(sale);
    events.push({
      type: 'product',
      date: sale.soldAt,
      description: `Venda de cachaca - ${s.bottleCount} garrafa(s)`,
      amount: s.ownerShareTotal,
      direction: 'in',
    });
  }

  const eventTypeLabels = { WEDDING: 'Casamento', BIRTHDAY: 'Aniversário', OTHER: 'Outro' };

  for (const session of sessions) {
    const s = serializeSession(session);
    events.push({
      type: 'photo_session',
      date: session.sessionAt,
      description: `Sessão de fotos - ${eventTypeLabels[session.eventType]} (${s.clientName})`,
      amount: s.ownerShareTotal,
      direction: 'in',
    });
  }

  for (const expense of expenses) {
    events.push({
      type: 'expense',
      date: expense.paidAt,
      description: expense.description,
      amount: Number(expense.amount),
      direction: 'out',
    });
  }

  for (const payout of payouts) {
    const categoryLabel = {
      VISITS: 'visitas',
      PRODUCTS: 'cachaça',
      PHOTOS: 'fotos',
      GENERAL: 'geral',
    }[payout.category];
    events.push({
      type: 'payout',
      date: payout.paidAt,
      description: payout.notes || `Repasse à ONG (${categoryLabel})`,
      amount: Number(payout.amount),
      direction: 'out',
    });
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  return events;
}

module.exports = { getSummary, getHistory };
