const { Router } = require('express');
const expensesController = require('../controllers/expensesController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(expensesController.list));
router.post('/', asyncHandler(expensesController.create));
router.put('/:id', asyncHandler(expensesController.update));
router.delete('/:id', asyncHandler(expensesController.remove));

module.exports = router;
