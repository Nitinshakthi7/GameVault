// Small shared helpers: async wrapper, response shapes, pagination.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ok = (res, data, message, status = 200) =>
    res.status(status).json({ success: true, ...(message && { message }), data });
const created = (res, data, message) => ok(res, data, message, 201);

const parsePagination = (query, defLimit = 24) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defLimit));
    return { page, limit, skip: (page - 1) * limit };
};
const pageMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
const paginated = (res, data, page, limit, total) =>
    res.status(200).json({ success: true, data, meta: pageMeta(page, limit, total) });

module.exports = { asyncHandler, ok, created, parsePagination, pageMeta, paginated };
