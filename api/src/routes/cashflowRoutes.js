const { Router } = require('express');
const cashflowController = require('../controllers/cashflowController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/summary', asyncHandler(cashflowController.summary));

module.exports = router;
