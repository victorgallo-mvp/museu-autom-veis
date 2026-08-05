const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const settingsService = require('./settingsService');
const { calcTotals } = require('../lib/money');

function serialize(sale) {
  const unitPriceSnapshot = Number(sale.unitPriceSnapshot);
  const commissionSnapshot = Number(sale.commissionSnapshot);
  const { total, commissionTotal, ownerShareTotal } = calcTotals(
    sale.bottleCount,
    unitPriceSnapshot,
    commissionSnapshot
  );

  return {
    id: sale.id,
    soldAt: sale.soldAt,
    bottleCount: sale.bottleCount,
    unitPriceSnapshot,
    commissionSnapshot,
    total,
    commissionTotal,
    ownerShareTotal,
    notes: sale.notes,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}

function buildWhere({ from, to }) {
  const where = {};

  if (from || to) {
    where.soldAt = {};
    if (from) where.soldAt.gte = from;
    if (to) where.soldAt.lte = to;
  }

  return where;
}

async function listSales(filters) {
  const sales = await prisma.cachacaSale.findMany({
    where: buildWhere(filters),
    orderBy: { soldAt: 'desc' },
  });

  return sales.map(serialize);
}

async function getSaleById(id) {
  const sale = await prisma.cachacaSale.findUnique({ where: { id } });

  if (!sale) {
    throw new AppError('Venda nao encontrada', 404);
  }

  return sale;
}

async function createSale(data) {
  const settings = await settingsService.getSettings();

  const sale = await prisma.cachacaSale.create({
    data: {
      soldAt: data.soldAt,
      bottleCount: data.bottleCount,
      notes: data.notes,
      unitPriceSnapshot: settings.cachacaPrice,
      commissionSnapshot: settings.cachacaCommission,
    },
  });

  return serialize(sale);
}

async function updateSale(id, data) {
  await getSaleById(id);

  const sale = await prisma.cachacaSale.update({
    where: { id },
    data: {
      soldAt: data.soldAt,
      bottleCount: data.bottleCount,
      notes: data.notes,
    },
  });

  return serialize(sale);
}

async function deleteSale(id) {
  await getSaleById(id);
  await prisma.cachacaSale.delete({ where: { id } });
}

module.exports = {
  listSales,
  createSale,
  updateSale,
  deleteSale,
  serializeSale: serialize,
};
