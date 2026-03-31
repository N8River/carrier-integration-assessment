export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "RATE_LIMIT_ERROR"
  | "CARRIER_ERROR"
  | "NETWORK_ERROR"
  | "PARSE_ERROR";

export class CarrierError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly carrier: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CarrierError";
  }
}

export function validationError(message: string): CarrierError {
  return new CarrierError("VALIDATION_ERROR", message, "system", false);
}
