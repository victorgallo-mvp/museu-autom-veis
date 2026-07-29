const { Router } = require('express');
const settingsController = require('../controllers/settingsController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(settingsController.getSettings));
router.put('/', asyncHandler(settingsController.updateSettings));

module.exports = router;
