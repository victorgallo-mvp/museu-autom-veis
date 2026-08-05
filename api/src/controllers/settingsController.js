const { z } = require('zod');
const settingsService = require('../services/settingsService');

const updateSettingsSchema = z.object({
  ticketPrice: z.number().positive(),
  guideCommissionPerPerson: z.number().positive(),
  cachacaPrice: z.number().nonnegative(),
  cachacaCommission: z.number().nonnegative(),
});

async function getSettings(req, res) {
  const settings = await settingsService.getSettings();
  res.json(settings);
}

async function updateSettings(req, res) {
  const data = updateSettingsSchema.parse(req.body);
  const settings = await settingsService.updateSettings(data);
  res.json(settings);
}

module.exports = { getSettings, updateSettings };
