export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  // 400
  static badRequest(message = "Bad Request"): AppError {
    return new AppError(message, 400);
  }

  // 401
  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401);
  }

  // 403
  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, 403);
  }

  // 404
  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, 404);
  }

  // 405
  static methodNotAllowed(message = "Method not allowed"): AppError {
    return new AppError(message, 405);
  }

  // 409
  static conflict(message = "Conflict"): AppError {
    return new AppError(message, 409);
  }

  // 410
  static gone(message = "Resource no longer available"): AppError {
    return new AppError(message, 410);
  }

  // 415
  static unsupportedMediaType(message = "Unsupported Media Type"): AppError {
    return new AppError(message, 415);
  }

  // 422
  static unprocessableEntity(message = "Validation failed"): AppError {
    return new AppError(message, 422);
  }

  // 429
  static tooManyRequests(message = "Too many requests"): AppError {
    return new AppError(message, 429);
  }

  // 500
  static internal(message = "Internal Server Error"): AppError {
    return new AppError(message, 500);
  }

  // 501
  static notImplemented(message = "Not Implemented"): AppError {
    return new AppError(message, 501);
  }

  // 502
  static badGateway(message = "Bad Gateway"): AppError {
    return new AppError(message, 502);
  }

  // 503
  static serviceUnavailable(message = "Service Unavailable"): AppError {
    return new AppError(message, 503);
  }

  // 504
  static gatewayTimeout(message = "Gateway Timeout"): AppError {
    return new AppError(message, 504);
  }
}
