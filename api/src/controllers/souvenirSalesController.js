const { z } = require('zod');
const souvenirSalesService = require('../services/souvenirSalesService');

const saleInputSchema = z.object({
  souvenirId: z.string().uuid(),
  soldAt: z.coerce.date(),
  quantity: z.number().int().positive(),
  notes: z.string().optional().nullable(),
});

const listQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  souvenirId: z.string().uuid().optional(),
});

async function list(req, res) {
  const filters = listQuerySchema.parse(req.query);
  const sales = await souvenirSalesService.listSales(filters);
  res.json(sales);
}

async function create(req, res) {
  const data = saleInputSchema.parse(req.body);
  const sale = await souvenirSalesService.createSale(data);
  res.status(201).json(sale);
}

async function update(req, res) {
  const data = saleInputSchema.parse(req.body);
  const sale = await souvenirSalesService.updateSale(req.params.id, data);
  res.json(sale);
}

async function remove(req, res) {
  await souvenirSalesService.deleteSale(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
