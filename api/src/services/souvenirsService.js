const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

function serialize(souvenir) {
  return {
    id: souvenir.id,
    name: souvenir.name,
    price: Number(souvenir.price),
    commission: Number(souvenir.commission),
    active: souvenir.active,
    sortOrder: souvenir.sortOrder,
    salesCount: souvenir._count?.sales ?? 0,
    createdAt: souvenir.createdAt,
    updatedAt: souvenir.updatedAt,
  };
}

const withCount = { _count: { select: { sales: true } } };

async function listSouvenirs({ includeInactive }) {
  const souvenirs = await prisma.souvenir.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: withCount,
  });

  return souvenirs.map(serialize);
}

async function getSouvenirById(id) {
  const souvenir = await prisma.souvenir.findUnique({ where: { id }, include: withCount });

  if (!souvenir) {
    throw new AppError('Produto não encontrado', 404);
  }

  return souvenir;
}

async function createSouvenir(data) {
  const souvenir = await prisma.souvenir.create({ data, include: withCount });
  return serialize(souvenir);
}

async function updateSouvenir(id, data) {
  await getSouvenirById(id);

  const souvenir = await prisma.souvenir.update({ where: { id }, data, include: withCount });
  return serialize(souvenir);
}

async function deleteSouvenir(id) {
  const souvenir = await getSouvenirById(id);

  if (souvenir._count.sales > 0) {
    throw new AppError(
      'Este produto já tem vendas registradas. Desative-o em vez de excluir.',
      409
    );
  }

  await prisma.souvenir.delete({ where: { id } });
}

module.exports = {
  listSouvenirs,
  getSouvenirById,
  createSouvenir,
  updateSouvenir,
  deleteSouvenir,
  serializeSouvenir: serialize,
};
