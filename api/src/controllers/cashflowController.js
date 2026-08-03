const cashflowService = require('../services/cashflowService');

async function summary(req, res) {
  const result = await cashflowService.getSummary();
  res.json(result);
}

module.exports = { summary };
