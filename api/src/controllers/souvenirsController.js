const { z } = require('zod');
const souvenirsService = require('../services/souvenirsService');

const souvenirInputSchema = z.object({
  name: z.string().trim().min(1),
  price: z.number().nonnegative(),
  commission: z.number().nonnegative().optional().default(0),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const listQuerySchema = z.object({
  includeInactive: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true' || value === '1'),
});

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  const souvenirs = await souvenirsService.listSouvenirs(filters);
  res.json(souvenirs);
}

async function create(req, res) {
  const data = souvenirInputSchema.parse(req.body);
  const souvenir = await souvenirsService.createSouvenir(data);
  res.status(201).json(souvenir);
}

async function update(req, res) {
  const data = souvenirInputSchema.parse(req.body);
  const souvenir = await souvenirsService.updateSouvenir(req.params.id, data);
  res.json(souvenir);
}

async function remove(req, res) {
  await souvenirsService.deleteSouvenir(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
