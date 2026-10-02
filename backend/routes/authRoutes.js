const router = require('express').Router();
const c = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');
const s = require('../validators/schemas');

router.use(authLimiter);
router.post('/register', validate({ body: s.register }), c.register);
router.post('/login', validate({ body: s.login }), c.login);
router.post('/logout', protect, c.logout);
router.post('/logout-all', protect, c.logoutAll);
router.get('/me', protect, c.me);
router.post('/forgot-password', validate({ body: s.forgot }), c.forgotPassword);
router.post('/reset-password', validate({ body: s.reset }), c.resetPassword);

module.exports = router;
