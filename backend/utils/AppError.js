class AppError extends Error {
    constructor(status, code, message, details, retryable) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.retryable = retryable;
        this.isAppError = true;
    }
    static badRequest(msg, details) { return new AppError(400, 'VALIDATION_ERROR', msg, details); }
    static unauthorized(msg = 'Authentication required') { return new AppError(401, 'UNAUTHORIZED', msg); }
    static notFound(msg = 'Resource not found') { return new AppError(404, 'NOT_FOUND', msg); }
    static conflict(msg, details) { return new AppError(409, 'CONFLICT', msg, details); }
    static provider(msg = 'The external game database did not respond.') {
        return new AppError(502, 'PROVIDER_UNAVAILABLE', msg, undefined, true);
    }
}
module.exports = AppError;
