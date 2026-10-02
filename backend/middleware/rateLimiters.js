const rateLimit = require('express-rate-limit');

const make = (opts) => rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
        success: false, code: 'RATE_LIMITED', retryable: true,
        message: 'Too many requests. Please wait a moment and try again.',
    }),
    skip: () => process.env.NODE_ENV === 'test',
    ...opts,
});

exports.globalLimiter = make({ windowMs: 15 * 60 * 1000, limit: 300 });
exports.authLimiter = make({ windowMs: 15 * 60 * 1000, limit: 20 });
exports.providerLimiter = make({
    windowMs: 60 * 1000,
    limit: 30,
    keyGenerator: (req) => (req.user ? String(req.user._id) : req.ip),
    validate: { keyGeneratorIpFallback: false },
});
