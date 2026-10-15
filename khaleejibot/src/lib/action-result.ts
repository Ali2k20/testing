/**
 * Uniform result for dashboard server actions consumed with useActionState.
 * `message` / `error` are full translation keys (e.g. "bots.updated").
 */
export type ActionResult =
  | { ok: true; message?: string; values?: Record<string, string | number> }
  | { ok: false; error: string; values?: Record<string, string | number> }
  | undefined;

export const forbidden = (): ActionResult => ({ ok: false, error: "common.forbidden" });
export const failed = (error = "common.genericError", values?: Record<string, string | number>): ActionResult => ({
  ok: false,
  error,
  values,
});
