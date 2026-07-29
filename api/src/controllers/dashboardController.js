const { z } = require('zod');
const dashboardService = require('../services/dashboardService');

const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function summary(req, res) {
  const { from, to } = summaryQuerySchema.parse(req.query);
  const result = await dashboardService.getSummary({ from, to });
  res.json(result);
}

module.exports = { summary };
