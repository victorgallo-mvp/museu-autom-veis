const prisma = require('../lib/prisma');
const { calcBookingTotals, round2 } = require('../lib/money');
const { serializeExpense } = require('./expensesService');
const { serializePayout } = require('./payoutsService');

const RECENT_LIMIT = 10;

async function getSummary() {
  const [paidBookings, expenses, payouts] = await Promise.all([
    prisma.booking.findMany({ where: { status: 'PAID' } }),
    prisma.expense.findMany(),
    prisma.payout.findMany(),
  ]);

  const ownerShareAccrued = round2(
    paidBookings.reduce((sum, booking) => {
      const { ownerShareTotal } = calcBookingTotals(
        booking.peopleCount,
        Number(booking.ticketPriceSnapshot),
        Number(booking.guideCommissionSnapshot)
      );
      return sum + ownerShareTotal;
    }, 0)
  );

  const expensesTotal = round2(expenses.reduce((sum, e) => sum + Number(e.amount), 0));
  const payoutsTotal = round2(payouts.reduce((sum, p) => sum + Number(p.amount), 0));
  const balance = round2(ownerShareAccrued - expensesTotal - payoutsTotal);

  const [recentExpenses, recentPayouts] = await Promise.all([
    prisma.expense.findMany({ orderBy: { paidAt: 'desc' }, take: RECENT_LIMIT }),
    prisma.payout.findMany({ orderBy: { paidAt: 'desc' }, take: RECENT_LIMIT }),
  ]);

  return {
    totals: {
      ownerShareAccrued,
      expenses: expensesTotal,
      payouts: payoutsTotal,
      balance,
    },
    recentExpenses: recentExpenses.map(serializeExpense),
    recentPayouts: recentPayouts.map(serializePayout),
  };
}

module.exports = { getSummary };
