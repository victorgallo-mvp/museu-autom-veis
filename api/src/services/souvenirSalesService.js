const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const souvenirsService = require('./souvenirsService');
const { calcTotals } = require('../lib/money');

function serialize(sale) {
  const unitPriceSnapshot = Number(sale.unitPriceSnapshot);
  const commissionSnapshot = Number(sale.commissionSnapshot);
  const { total, commissionTotal, ownerShareTotal } = calcTotals(
    sale.quantity,
    unitPriceSnapshot,
    commissionSnapshot
  );

  return {
    id: sale.id,
    souvenirId: sale.souvenirId,
    souvenirName: sale.nameSnapshot,
    soldAt: sale.soldAt,
    quantity: sale.quantity,
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

function buildWhere({ from, to, souvenirId }) {
  const where = {};

  if (from || to) {
    where.soldAt = {};
    if (from) where.soldAt.gte = from;
    if (to) where.soldAt.lte = to;
  }

  if (souvenirId) {
    where.souvenirId = souvenirId;
  }

  return where;
}

async function listSales(filters) {
  const sales = await prisma.souvenirSale.findMany({
    where: buildWhere(filters),
    orderBy: { soldAt: 'desc' },
  });

  return sales.map(serialize);
}

async function getSaleById(id) {
  const sale = await prisma.souvenirSale.findUnique({ where: { id } });

  if (!sale) {
    throw new AppError('Venda não encontrada', 404);
  }

  return sale;
}

// Congela nome, preço e comissão do produto no momento da venda.
async function snapshotFrom(souvenirId) {
  const souvenir = await souvenirsService.getSouvenirById(souvenirId);
  return {
    nameSnapshot: souvenir.name,
    unitPriceSnapshot: souvenir.price,
    commissionSnapshot: souvenir.commission,
  };
}

async function createSale(data) {
  const snapshot = await snapshotFrom(data.souvenirId);

  const sale = await prisma.souvenirSale.create({
    data: {
      souvenirId: data.souvenirId,
      soldAt: data.soldAt,
      quantity: data.quantity,
      notes: data.notes,
      ...snapshot,
    },
  });

  return serialize(sale);
}

async function updateSale(id, data) {
  const existing = await getSaleById(id);

  // Trocar o produto de uma venda refaz o snapshot com os valores atuais dele.
  const snapshot =
    data.souvenirId && data.souvenirId !== existing.souvenirId
      ? await snapshotFrom(data.souvenirId)
      : {};

  const sale = await prisma.souvenirSale.update({
    where: { id },
    data: {
      souvenirId: data.souvenirId,
      soldAt: data.soldAt,
      quantity: data.quantity,
      notes: data.notes,
      ...snapshot,
    },
  });

  return serialize(sale);
}

async function deleteSale(id) {
  await getSaleById(id);
  await prisma.souvenirSale.delete({ where: { id } });
}

module.exports = {
  listSales,
  createSale,
  updateSale,
  deleteSale,
  serializeSouvenirSale: serialize,
};
