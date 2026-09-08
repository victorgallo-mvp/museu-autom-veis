const { Router } = require('express');
const souvenirsController = require('../controllers/souvenirsController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(souvenirsController.list));
router.post('/', asyncHandler(souvenirsController.create));
router.put('/:id', asyncHandler(souvenirsController.update));
router.delete('/:id', asyncHandler(souvenirsController.remove));

module.exports = router;
