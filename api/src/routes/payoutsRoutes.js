const { Router } = require('express');
const payoutsController = require('../controllers/payoutsController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(payoutsController.list));
router.post('/', asyncHandler(payoutsController.create));
router.put('/:id', asyncHandler(payoutsController.update));
router.delete('/:id', asyncHandler(payoutsController.remove));

module.exports = router;
