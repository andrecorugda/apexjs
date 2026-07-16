// errors.ts — typed data-layer exceptions (Eloquent-style). Operations never swallow
// errors: a driver failure is rethrown as a QueryException carrying the model + op + the
// original error as `.cause` (so the server's onError hook logs the full detail while the
// API masks it from clients), and a missing row from `*OrFail` throws ModelNotFoundException.
//
// Each error carries `httpStatus` so the API layer can map it (404 vs 500) by duck-typing,
// without @apex-stack/core needing to import this module.

export class ApexDataError extends Error {
  /** Suggested HTTP status if this bubbles to a request handler. */
  httpStatus = 500
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions)
    this.name = new.target.name
  }
}

/** Thrown by `findOrFail`/`firstOrFail` when no row matches. Maps to HTTP 404. */
export class ModelNotFoundException extends ApexDataError {
  override httpStatus = 404
  constructor(
    readonly model: string,
    readonly criteria?: unknown,
  ) {
    super(
      `No query results for model '${model}'${
        criteria !== undefined ? ` matching ${JSON.stringify(criteria)}` : ''
      }`,
    )
  }
}

/** Wraps a driver error from a query/write, with model + op context. Maps to HTTP 500. */
export class QueryException extends ApexDataError {
  constructor(
    readonly model: string,
    readonly op: string,
    cause: unknown,
  ) {
    super(`[apex] ${op} on '${model}' failed: ${(cause as Error)?.message ?? String(cause)}`, {
      cause,
    })
  }
}

/**
 * Run a data operation, converting any driver error into a QueryException (preserving the
 * original as `.cause`). Already-typed ApexDataErrors (e.g. a nested ModelNotFound) pass through.
 */
export async function guard<T>(model: string, op: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ApexDataError) throw e
    throw new QueryException(model, op, e)
  }
}
