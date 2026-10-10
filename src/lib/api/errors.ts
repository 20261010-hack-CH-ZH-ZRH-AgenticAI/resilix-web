import type { MessageKey } from "@/lib/i18n/messages";
import { ApiError } from "./client";

export function apiErrorKey(reason: unknown): MessageKey {
  if (!(reason instanceof ApiError))
    return reason instanceof TypeError ? "networkError" : "errorUnknown";
  if ([400, 413, 422].includes(reason.status)) return "errorInvalidInput";
  if (reason.status === 401) return "errorAuthentication";
  if (reason.status === 403) return "errorForbidden";
  if (reason.status === 404) return "errorNotFound";
  if (reason.status === 409) return "errorConflict";
  if (reason.status === 429) return "errorRateLimit";
  if (reason.status >= 500) return "errorUnavailable";
  return "errorUnknown";
}
