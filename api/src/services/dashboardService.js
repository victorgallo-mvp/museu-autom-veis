const prisma = require('../lib/prisma');
const { calcBookingTotals, round2 } = require('../lib/money');
const { serializeBooking } = require('./bookingsService');

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

function accumulate(amounts, booking) {
  const ticketPriceSnapshot = Number(booking.ticketPriceSnapshot);
  const guideCommissionSnapshot = Number(booking.guideCommissionSnapshot);
  const { total, guideCommissionTotal, ownerShareTotal } = calcBookingTotals(
    booking.peopleCount,
    ticketPriceSnapshot,
    guideCommissionSnapshot
  );

  amounts.people += booking.peopleCount;
  amounts.revenue = round2(amounts.revenue + total);
  amounts.guideCommission = round2(amounts.guideCommission + guideCommissionTotal);
  amounts.ownerShare = round2(amounts.ownerShare + ownerShareTotal);
}

async function getSummary({ from, to }) {
  const period = {
    from: from || defaultPeriod().from,
    to: to || defaultPeriod().to,
  };
  const now = new Date();

  const periodBookings = await prisma.booking.findMany({
    where: { scheduledAt: { gte: period.from, lte: period.to } },
  });

  const counts = { total: 0, pending: 0, paid: 0, canceled: 0, noShow: 0 };
  const totals = emptyAmounts();
  const forecast = emptyAmounts();

  for (const booking of periodBookings) {
    counts.total += 1;

    if (booking.status === 'PENDING') {
      counts.pending += 1;
      if (booking.scheduledAt >= now) {
        accumulate(forecast, booking);
      }
    } else if (booking.status === 'PAID') {
      counts.paid += 1;
      accumulate(totals, booking);
    } else if (booking.status === 'CANCELED') {
      counts.canceled += 1;
    } else if (booking.status === 'NO_SHOW') {
      counts.noShow += 1;
    }
  }

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
    period,
    counts,
    totals,
    forecast,
    upcoming: upcomingRaw.map(serializeBooking),
    recent: recentRaw.map(serializeBooking),
  };
}

module.exports = { getSummary };
