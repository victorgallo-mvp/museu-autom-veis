const { Router } = require('express');
const dashboardController = require('../controllers/dashboardController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/summary', asyncHandler(dashboardController.summary));

module.exports = router;
