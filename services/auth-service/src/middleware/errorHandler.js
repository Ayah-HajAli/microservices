// Single place to translate thrown errors into HTTP responses.
// Keep secrets out of error messages — only safe text reaches the client.

module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    req.log?.error({ err }, 'unhandled error');
  } else {
    req.log?.warn({ err: { message: err.message, status } }, 'client error');
  }
  res.status(status).json({
    error: err.code || (status >= 500 ? 'internal_error' : 'bad_request'),
    message: status >= 500 ? 'Something went wrong' : err.message,
  });
};
