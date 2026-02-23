/**
 * Base application error class with structured error codes and HTTP status codes.
 * All custom errors should extend this class to ensure consistent error handling.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** Thrown when a requested resource does not exist (HTTP 404). */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}을(를) 찾을 수 없습니다.`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

/** Thrown when the user lacks permission for the requested action (HTTP 403). */
export class ForbiddenError extends AppError {
  constructor(message = '접근 권한이 없습니다.') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

/** Thrown when the user is not authenticated (HTTP 401). */
export class UnauthorizedError extends AppError {
  constructor(message = '로그인이 필요합니다.') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

/** Thrown when request data fails validation (HTTP 400). */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Converts an error into a structured JSON Response for API route handlers.
 * Known AppError instances return their specific status code and message.
 * Unknown errors are logged and return a generic 500 response to avoid leaking internals.
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: error.message }, { status: error.statusCode })
  }

  console.error('Unexpected error:', error)
  return Response.json(
    { error: '서버 오류가 발생했습니다.' },
    { status: 500 }
  )
}
