const { z } = require('zod');
const cachacaSalesService = require('../services/cachacaSalesService');

const saleInputSchema = z.object({
  soldAt: z.coerce.date(),
  bottleCount: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  const sales = await cachacaSalesService.listSales(filters);
  res.json(sales);
}

async function create(req, res) {
  const data = saleInputSchema.parse(req.body);
  const sale = await cachacaSalesService.createSale(data);
  res.status(201).json(sale);
}

async function update(req, res) {
  const data = saleInputSchema.parse(req.body);
  const sale = await cachacaSalesService.updateSale(req.params.id, data);
  res.json(sale);
}

async function remove(req, res) {
  await cachacaSalesService.deleteSale(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
