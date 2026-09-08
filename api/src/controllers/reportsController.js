const { z } = require('zod');
const reportsService = require('../services/reportsService');

const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function report(req, res) {
  const { from, to } = reportQuerySchema.parse(req.query);
  const result = await reportsService.getReport({ from, to });
  res.json(result);
}

module.exports = { report };
