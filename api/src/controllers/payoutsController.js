const { z } = require('zod');
const payoutsService = require('../services/payoutsService');

const payoutInputSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  notes: z.string().optional().nullable(),
});

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  const payouts = await payoutsService.listPayouts(filters);
  res.json(payouts);
}

async function create(req, res) {
  const data = payoutInputSchema.parse(req.body);
  const payout = await payoutsService.createPayout(data);
  res.status(201).json(payout);
}

async function update(req, res) {
  const data = payoutInputSchema.parse(req.body);
  const payout = await payoutsService.updatePayout(req.params.id, data);
  res.json(payout);
}

async function remove(req, res) {
  await payoutsService.deletePayout(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
