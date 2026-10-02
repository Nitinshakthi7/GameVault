const router = require('express').Router();
const c = require('../controllers/gameController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { providerLimiter } = require('../middleware/rateLimiters');
const s = require('../validators/schemas');

router.use(protect);
router.get('/search', providerLimiter, validate({ query: s.searchQuery }), c.search);
router.get('/external/:provider/:externalId', providerLimiter, validate({ params: s.externalParams }), c.external);
router.get('/:id', validate({ params: s.idParams }), c.getById);

module.exports = router;
