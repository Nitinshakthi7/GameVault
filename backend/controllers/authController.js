const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { asyncHandler, ok, created } = require('../utils/helpers');
const serialize = require('../utils/serialize');

const signToken = (user) =>
    jwt.sign({ id: String(user._id), tv: user.tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

exports.register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const clash = await User.findOne({ $or: [{ email }, { username }] }).collation({ locale: 'en', strength: 2 });
    if (clash) {
        const field = clash.email === email ? 'email' : 'username';
        throw AppError.conflict(`That ${field} is already registered.`, { field });
    }
    const user = await User.create({ username, email, password });
    created(res, { token: signToken(user), user: serialize.user(user) }, 'Account created');
});

exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) throw AppError.unauthorized('Invalid email or password');
    user.lastLoginAt = new Date();
    await user.save();
    ok(res, { token: signToken(user), user: serialize.user(user) });
});

exports.logout = asyncHandler(async (req, res) => ok(res, null, 'Logged out'));

exports.logoutAll = asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    ok(res, null, 'Logged out of all sessions');
});

exports.me = asyncHandler(async (req, res) => ok(res, serialize.user(req.user)));

exports.forgotPassword = asyncHandler(async (req, res) => {
    const generic = 'If an account exists for that email, a reset link has been generated.';
    const user = await User.findOne({ email: req.body.email });
    let resetUrl;
    if (user) {
        const raw = crypto.randomBytes(32).toString('hex');
        user.passwordResetTokenHash = sha256(raw);
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        const base = process.env.APP_URL || 'http://localhost:5173';
        resetUrl = `${base}/reset-password?token=${raw}`;
        // No SMTP configured: expose the link outside production only.
        if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
            console.log(`Password reset link for ${user.email}: ${resetUrl}`);
        }
    }
    const showUrl = resetUrl && process.env.NODE_ENV !== 'production';
    ok(res, showUrl ? { resetUrl } : null, generic);
});

exports.resetPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        passwordResetTokenHash: sha256(req.body.token),
        passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetTokenHash +passwordResetExpires');
    if (!user) throw AppError.badRequest('This reset link is invalid or has expired. Request a new one.');
    user.password = req.body.password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1;
    await user.save();
    ok(res, null, 'Password updated. You can now log in.');
});
