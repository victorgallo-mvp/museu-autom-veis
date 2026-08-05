const { z } = require('zod');
const cashflowService = require('../services/cashflowService');

const historyQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function summary(req, res) {
  const result = await cashflowService.getSummary();
  res.json(result);
}

async function history(req, res) {
  const filters = historyQuerySchema.parse(req.query);
  const result = await cashflowService.getHistory(filters);
  res.json(result);
}

module.exports = { summary, history };
