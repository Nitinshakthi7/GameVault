// Logs method, path, status and duration only - never request bodies or auth headers.
module.exports = (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const start = Date.now();
    res.on('finish', () => {
        const path = req.originalUrl.split('?')[0];
        console.log(`${new Date().toISOString()} ${req.method} ${path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
};
