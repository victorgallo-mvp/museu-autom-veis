const { Router } = require('express');
const souvenirSalesController = require('../controllers/souvenirSalesController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(souvenirSalesController.list));
router.post('/', asyncHandler(souvenirSalesController.create));
router.put('/:id', asyncHandler(souvenirSalesController.update));
router.delete('/:id', asyncHandler(souvenirSalesController.remove));

module.exports = router;
