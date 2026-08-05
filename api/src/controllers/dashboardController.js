const { z } = require('zod');
const dashboardService = require('../services/dashboardService');

const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  upcomingDays: z.coerce.number().int().positive().optional(),
});

const forecastQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

async function summary(req, res) {
  const { from, to, upcomingDays } = summaryQuerySchema.parse(req.query);
  const result = await dashboardService.getSummary({ from, to, upcomingDays });
  res.json(result);
}

async function forecast(req, res) {
  const { from, to } = forecastQuerySchema.parse(req.query);
  const result = await dashboardService.getForecast({ from, to });
  res.json(result);
}

module.exports = { summary, forecast };
