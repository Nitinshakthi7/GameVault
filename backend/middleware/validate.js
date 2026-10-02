const AppError = require('../utils/AppError');

// validate({ params, query, body }) with zod schemas. Parsed body/params replace originals;
// parsed query is exposed as req.validQuery.
module.exports = (schemas) => (req, res, next) => {
    for (const part of ['params', 'query', 'body']) {
        if (!schemas[part]) continue;
        const parsed = schemas[part].safeParse(req[part] ?? {});
        if (!parsed.success) {
            const details = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
            const first = details[0];
            return next(AppError.badRequest(first ? `${first.field ? first.field + ': ' : ''}${first.message}` : 'Invalid request', details));
        }
        if (part === 'query') req.validQuery = parsed.data;
        else req[part] = parsed.data;
    }
    next();
};
