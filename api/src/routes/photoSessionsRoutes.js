const { Router } = require('express');
const photoSessionsController = require('../controllers/photoSessionsController');
const requireAuth = require('../middlewares/requireAuth');
const asyncHandler = require('../lib/asyncHandler');

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(photoSessionsController.list));
router.post('/', asyncHandler(photoSessionsController.create));
router.put('/:id', asyncHandler(photoSessionsController.update));
router.delete('/:id', asyncHandler(photoSessionsController.remove));

module.exports = router;
