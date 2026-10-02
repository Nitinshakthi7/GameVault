const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { asyncHandler, ok } = require('../utils/helpers');
const analytics = require('../services/analyticsService');

// Mounted at /api, so auth is applied per-route (not router.use) to keep unknown paths as 404.
router.get('/dashboard', protect, asyncHandler(async (req, res) => ok(res, await analytics.dashboard(req.user._id))));
router.get('/analytics/overview', protect, asyncHandler(async (req, res) => ok(res, await analytics.overview(req.user._id))));

module.exports = router;
