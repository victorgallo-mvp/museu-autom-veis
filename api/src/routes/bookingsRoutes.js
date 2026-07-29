const { Router } = require('express');
const bookingsController = require('../controllers/bookingsController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(bookingsController.list));
router.post('/', asyncHandler(bookingsController.create));
router.get('/:id', asyncHandler(bookingsController.getById));
router.put('/:id', asyncHandler(bookingsController.update));
router.patch('/:id/status', asyncHandler(bookingsController.updateStatus));
router.delete('/:id', asyncHandler(bookingsController.remove));

module.exports = router;
