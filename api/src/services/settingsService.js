const prisma = require('../lib/prisma');

function serialize(setting) {
  return {
    ticketPrice: Number(setting.ticketPrice),
    guideCommissionPerPerson: Number(setting.guideCommissionPerPerson),
    cachacaPrice: Number(setting.cachacaPrice),
    cachacaCommission: Number(setting.cachacaCommission),
    updatedAt: setting.updatedAt,
  };
}

async function getSettings() {
  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  return serialize(setting);
}

async function updateSettings({
  ticketPrice,
  guideCommissionPerPerson,
  cachacaPrice,
  cachacaCommission,
}) {
  const data = { ticketPrice, guideCommissionPerPerson, cachacaPrice, cachacaCommission };

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return serialize(setting);
}

module.exports = { getSettings, updateSettings };
