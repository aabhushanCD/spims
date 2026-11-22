export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly headers?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    headers?: Record<string, string>,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    if (code !== undefined) {
      this.code = code;
    }
    if (headers !== undefined) {
      this.headers = headers;
    }

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  // 400
  static badRequest(message = "Bad Request", code?: string): AppError {
    return new AppError(message, 400, code);
  }

  // 401
  static unauthorized(message = "Unauthorized", code?: string): AppError {
    return new AppError(message, 401, code);
  }

  // 403
  static forbidden(message = "Forbidden", code?: string): AppError {
    return new AppError(message, 403, code);
  }

  // 404
  static notFound(message = "Resource not found", code?: string): AppError {
    return new AppError(message, 404, code);
  }

  // 405
  static methodNotAllowed(message = "Method not allowed", code?: string): AppError {
    return new AppError(message, 405, code);
  }

  // 409
  static conflict(message = "Conflict", code?: string): AppError {
    return new AppError(message, 409, code);
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

  // 423
  static locked(
    message = "Account temporarily locked",
    code?: string,
    retryAfterSeconds?: number,
  ): AppError {
    return new AppError(
      message,
      423,
      code,
      retryAfterSeconds !== undefined
        ? { "Retry-After": String(Math.max(1, retryAfterSeconds)) }
        : undefined,
    );
  }

  // 429
  static tooManyRequests(message = "Too many requests", code?: string): AppError {
    return new AppError(message, 429, code);
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
