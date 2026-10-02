const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/helpers');

const protect = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw AppError.unauthorized('Not authorized, no token provided');
    let decoded;
    try {
        decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (e) {
        throw AppError.unauthorized('Session expired. Please log in again.');
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user || (decoded.tv ?? 0) !== user.tokenVersion) {
        throw AppError.unauthorized('Session expired. Please log in again.');
    }
    req.user = user;
    next();
});

module.exports = { protect };
