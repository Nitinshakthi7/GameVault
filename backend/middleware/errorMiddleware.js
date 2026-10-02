const { ZodError } = require('zod');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
    let status = 500;
    let code = 'INTERNAL';
    let message = 'An unexpected error occurred. Please try again.';
    let details;
    let retryable;

    if (err.isAppError) {
        ({ status, code, message, details, retryable } = err);
    } else if (err instanceof ZodError) {
        status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid request';
        details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    } else if (err.name === 'ValidationError') {
        status = 400; code = 'VALIDATION_ERROR';
        details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
        message = details[0]?.message || 'Invalid data';
    } else if (err.name === 'CastError') {
        status = 400; code = 'VALIDATION_ERROR'; message = `Invalid value for ${err.path}`;
    } else if (err.code === 11000) {
        status = 409; code = 'CONFLICT'; message = 'That record already exists.';
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        status = 401; code = 'UNAUTHORIZED'; message = 'Session expired. Please log in again.';
    } else if (err.type === 'entity.parse.failed') {
        status = 400; code = 'VALIDATION_ERROR'; message = 'Malformed JSON body';
    } else if (err.type === 'entity.too.large') {
        status = 413; code = 'VALIDATION_ERROR'; message = 'Request body too large';
    }

    if (status >= 500 && process.env.NODE_ENV !== 'test') {
        console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
    }

    res.status(status).json({
        success: false, message, code,
        ...(details && { details }),
        ...(retryable !== undefined && { retryable }),
    });
};
