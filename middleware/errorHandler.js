export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Not found',
    data: [],
  });
}

export function errorHandler(err, req, res, _next) {
  const status = Number.isFinite(err?.status) ? err.status : 500;
  const message = status === 500 ? 'Internal server error' : (err?.message || 'Request failed');

  res.status(status).json({
    success: false,
    message,
    data: [],
  });
}
