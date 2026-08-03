const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

function serialize(expense) {
  return {
    id: expense.id,
    description: expense.description,
    amount: Number(expense.amount),
    paidAt: expense.paidAt,
    notes: expense.notes,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

function buildWhere({ from, to }) {
  const where = {};

  if (from || to) {
    where.paidAt = {};
    if (from) where.paidAt.gte = from;
    if (to) where.paidAt.lte = to;
  }

  return where;
}

async function listExpenses(filters) {
  const expenses = await prisma.expense.findMany({
    where: buildWhere(filters),
    orderBy: { paidAt: 'desc' },
  });

  return expenses.map(serialize);
}

async function getExpenseById(id) {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw new AppError('Despesa nao encontrada', 404);
  }

  return expense;
}

async function createExpense(data) {
  const expense = await prisma.expense.create({ data });
  return serialize(expense);
}

async function updateExpense(id, data) {
  await getExpenseById(id);

  const expense = await prisma.expense.update({ where: { id }, data });
  return serialize(expense);
}

async function deleteExpense(id) {
  await getExpenseById(id);
  await prisma.expense.delete({ where: { id } });
}

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  serializeExpense: serialize,
};
