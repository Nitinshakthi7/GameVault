const router = require('express').Router();
const c = require('../controllers/wishlistController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const s = require('../validators/schemas');

router.use(protect);
router.get('/', validate({ query: s.wishlistQuery }), c.list);
router.post('/', validate({ body: s.wishlistAdd }), c.add);
router.patch('/:id', validate({ params: s.idParams, body: s.wishlistPatch }), c.update);
router.delete('/:id', validate({ params: s.idParams }), c.remove);
router.post('/:id/move-to-library', validate({ params: s.idParams, body: s.moveToLibraryBody }), c.moveToLibrary);

module.exports = router;
