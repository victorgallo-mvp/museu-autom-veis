const { Router } = require('express');
const cachacaSalesController = require('../controllers/cachacaSalesController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(cachacaSalesController.list));
router.post('/', asyncHandler(cachacaSalesController.create));
router.put('/:id', asyncHandler(cachacaSalesController.update));
router.delete('/:id', asyncHandler(cachacaSalesController.remove));

module.exports = router;
