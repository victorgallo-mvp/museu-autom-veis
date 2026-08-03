const { z } = require('zod');
const expensesService = require('../services/expensesService');

const expenseInputSchema = z.object({
  description: z.string().min(1),
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
  const expenses = await expensesService.listExpenses(filters);
  res.json(expenses);
}

async function create(req, res) {
  const data = expenseInputSchema.parse(req.body);
  const expense = await expensesService.createExpense(data);
  res.status(201).json(expense);
}

async function update(req, res) {
  const data = expenseInputSchema.parse(req.body);
  const expense = await expensesService.updateExpense(req.params.id, data);
  res.json(expense);
}

async function remove(req, res) {
  await expensesService.deleteExpense(req.params.id);
  res.status(204).send();
}

module.exports = { list, create, update, remove };
