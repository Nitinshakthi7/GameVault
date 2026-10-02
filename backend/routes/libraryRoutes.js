const router = require('express').Router();
const c = require('../controllers/libraryController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const s = require('../validators/schemas');

router.use(protect);
router.get('/facets', c.facets);
router.get('/', validate({ query: s.libraryQuery }), c.list);
router.post('/', validate({ body: s.libraryAdd }), c.add);
router.get('/:id', validate({ params: s.idParams }), c.get);
router.patch('/:id', validate({ params: s.idParams, body: s.libraryPatch }), c.update);
router.delete('/:id', validate({ params: s.idParams }), c.remove);
router.post('/:id/to-wishlist', validate({ params: s.idParams, body: s.toWishlistBody }), c.toWishlist);

module.exports = router;
