export function errorHandler(error, _request, response, _next) {
  const status = error.statusCode || 500;
  const message = status === 500 ? "Internal server error" : error.message;

  if (status === 500) console.error("Unhandled API error");

  const body = {
    error: {
      message,
    },
  };

  if (error.details) body.error.details = error.details;

  response.status(status).json(body);
}
