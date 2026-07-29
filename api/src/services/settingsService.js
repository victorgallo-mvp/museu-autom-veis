const prisma = require('../lib/prisma');

function serialize(setting) {
  return {
    ticketPrice: Number(setting.ticketPrice),
    guideCommissionPerPerson: Number(setting.guideCommissionPerPerson),
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

async function updateSettings({ ticketPrice, guideCommissionPerPerson }) {
  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: { ticketPrice, guideCommissionPerPerson },
    create: { id: 1, ticketPrice, guideCommissionPerPerson },
  });

  return serialize(setting);
}

module.exports = { getSettings, updateSettings };
