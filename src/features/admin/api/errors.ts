/** Error codes the admin API returns in `{ error: { code, message, fields? } }`. */
export type ApiErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "unknown_email"
  | "bad_code"
  | "rate_limited"
  | "network"
  | "server";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string = code,
    /** Field name → error code, for `validation`. */
    public fields?: Record<string, string>,
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
