module.exports = function (err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) req.log?.error({ err }); else req.log?.warn({ err: { message: err.message, status } });
  res.status(status).json({ error: err.code || (status >= 500 ? 'internal_error' : 'bad_request'), message: status >= 500 ? 'Something went wrong' : err.message });
};
