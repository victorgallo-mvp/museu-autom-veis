const { Router } = require('express');
const reportsController = require('../controllers/reportsController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(reportsController.report));

module.exports = router;
