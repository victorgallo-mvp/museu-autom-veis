const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

function serialize(payout) {
  return {
    id: payout.id,
    amount: Number(payout.amount),
    paidAt: payout.paidAt,
    notes: payout.notes,
    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt,
  };
}

function buildWhere({ from, to }) {
  const where = {};

  if (from || to) {
    where.paidAt = {};
    if (from) where.paidAt.gte = from;
    if (to) where.paidAt.lte = to;
  }

  return where;
}

async function listPayouts(filters) {
  const payouts = await prisma.payout.findMany({
    where: buildWhere(filters),
    orderBy: { paidAt: 'desc' },
  });

  return payouts.map(serialize);
}

async function getPayoutById(id) {
  const payout = await prisma.payout.findUnique({ where: { id } });

  if (!payout) {
    throw new AppError('Repasse nao encontrado', 404);
  }

  return payout;
}

async function createPayout(data) {
  const payout = await prisma.payout.create({ data });
  return serialize(payout);
}

async function updatePayout(id, data) {
  await getPayoutById(id);

  const payout = await prisma.payout.update({ where: { id }, data });
  return serialize(payout);
}

async function deletePayout(id) {
  await getPayoutById(id);
  await prisma.payout.delete({ where: { id } });
}

module.exports = {
  listPayouts,
  createPayout,
  updatePayout,
  deletePayout,
  serializePayout: serialize,
};
