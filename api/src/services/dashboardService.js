const prisma = require('../lib/prisma');
const { calcTotals, round2 } = require('../lib/money');
const { serializeBooking } = require('./bookingsService');
const { serializeSale } = require('./cachacaSalesService');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 10;

function defaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function emptyAmounts() {
  return { people: 0, revenue: 0, guideCommission: 0, ownerShare: 0 };
}

function effectiveCount(booking) {
  return booking.actualPeopleCount ?? booking.expectedPeopleCount;
}

function accumulate(amounts, booking) {
  const ticketPriceSnapshot = Number(booking.ticketPriceSnapshot);
  const guideCommissionSnapshot = Number(booking.guideCommissionSnapshot);
  const { total, commissionTotal, ownerShareTotal } = calcTotals(
    effectiveCount(booking),
    ticketPriceSnapshot,
    guideCommissionSnapshot
  );

  amounts.people += effectiveCount(booking);
  amounts.revenue = round2(amounts.revenue + total);
  amounts.guideCommission = round2(amounts.guideCommission + commissionTotal);
  amounts.ownerShare = round2(amounts.ownerShare + ownerShareTotal);
}

async function getVisitsSummary(period, now) {
  const periodBookings = await prisma.booking.findMany({
    where: { scheduledAt: { gte: period.from, lte: period.to } },
  });

  const counts = { total: 0, pending: 0, paid: 0, canceled: 0, noShow: 0, visitCount: 0 };
  const totals = emptyAmounts();
  const forecast = emptyAmounts();
  const attendance = { expected: 0, actual: 0 };
  const visitSlots = new Set();

  for (const booking of periodBookings) {
    counts.total += 1;
    visitSlots.add(booking.scheduledAt.getTime());

    if (booking.status === 'PENDING') {
      counts.pending += 1;
      if (booking.scheduledAt >= now) {
        accumulate(forecast, booking);
      }
    } else if (booking.status === 'PAID') {
      counts.paid += 1;
      accumulate(totals, booking);
      attendance.expected += booking.expectedPeopleCount;
      attendance.actual += effectiveCount(booking);
    } else if (booking.status === 'CANCELED') {
      counts.canceled += 1;
    } else if (booking.status === 'NO_SHOW') {
      counts.noShow += 1;
      attendance.expected += booking.expectedPeopleCount;
      attendance.actual += effectiveCount(booking);
    }
  }

  counts.visitCount = visitSlots.size;

  const [upcomingRaw, recentRaw] = await Promise.all([
    prisma.booking.findMany({
      where: { scheduledAt: { gte: now, lte: new Date(now.getTime() + SEVEN_DAYS_MS) } },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.booking.findMany({
      orderBy: { updatedAt: 'desc' },
      take: RECENT_LIMIT,
    }),
  ]);

  return {
    counts,
    totals,
    forecast,
    attendance,
    upcoming: upcomingRaw.map(serializeBooking),
    recent: recentRaw.map(serializeBooking),
  };
}

async function getProductsSummary(period) {
  const periodSales = await prisma.cachacaSale.findMany({
    where: { soldAt: { gte: period.from, lte: period.to } },
  });

  const totals = { bottles: 0, revenue: 0, commission: 0, ownerShare: 0 };

  for (const sale of periodSales) {
    const unitPriceSnapshot = Number(sale.unitPriceSnapshot);
    const commissionSnapshot = Number(sale.commissionSnapshot);
    const { total, commissionTotal, ownerShareTotal } = calcTotals(
      sale.bottleCount,
      unitPriceSnapshot,
      commissionSnapshot
    );

    totals.bottles += sale.bottleCount;
    totals.revenue = round2(totals.revenue + total);
    totals.commission = round2(totals.commission + commissionTotal);
    totals.ownerShare = round2(totals.ownerShare + ownerShareTotal);
  }

  const recentRaw = await prisma.cachacaSale.findMany({
    orderBy: { updatedAt: 'desc' },
    take: RECENT_LIMIT,
  });

  return {
    counts: { total: periodSales.length },
    totals,
    recent: recentRaw.map(serializeSale),
  };
}

async function getSummary({ from, to }) {
  const period = {
    from: from || defaultPeriod().from,
    to: to || defaultPeriod().to,
  };
  const now = new Date();

  const [visits, products] = await Promise.all([
    getVisitsSummary(period, now),
    getProductsSummary(period),
  ]);

  return { period, visits, products };
}

module.exports = { getSummary };
