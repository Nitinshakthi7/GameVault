const router = require('express').Router();
const c = require('../controllers/sessionController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const s = require('../validators/schemas');

router.use(protect);
router.get('/', validate({ query: s.sessionQuery }), c.list);
router.post('/', validate({ body: s.sessionCreate }), c.create);
router.patch('/:id', validate({ params: s.idParams, body: s.sessionPatch }), c.update);
router.delete('/:id', validate({ params: s.idParams }), c.remove);

module.exports = router;
