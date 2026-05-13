/**
 * Extracts the error message from various error types.
 * Handles Supabase errors, Axios errors, and generic errors.
 */
export const getErrorMessage = (error: any): string => {
  if (!error) {
    return "An unknown error occurred";
  }

  // Handle Axios errors with a response body (most Edge Function errors land here
  // because supabaseHttpClient is axios-based)
  if (error.response?.data) {
    const data = error.response.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }
    // Edge Functions typically return { error: "..." } or { message: "..." }
    if (data.error && typeof data.error === "string") return data.error;
    if (data.message && typeof data.message === "string") return data.message;
    if (data.errors) {
      return Array.isArray(data.errors)
        ? data.errors.join(", ")
        : Object.values(data.errors as Record<string, unknown>).join(", ");
    }
    // Try to stringify the whole body so nothing is lost
    try {
      const json = JSON.stringify(data);
      if (json !== "{}") return json;
    } catch {
      // ignore
    }
    return `HTTP ${error.response.status}: ${error.response.statusText}`;
  }

  // Handle Supabase JS client errors (has message + optional details/hint/code)
  if (error.message && (error.details || error.hint || error.code)) {
    const parts: string[] = [error.message];
    if (error.details) parts.push(`Details: ${error.details}`);
    if (error.hint) parts.push(`Hint: ${error.hint}`);
    if (error.code) parts.push(`Code: ${error.code}`);
    return parts.join(" | ");
  }

  // Axios network errors (no response — timeout, DNS failure, etc.)
  if (error.code && error.message) {
    return `${error.message} (${error.code})`;
  }

  // Generic Error
  if (error.message) {
    return error.message;
  }

  return String(error);
};

/**
 * Extracts the error details for debugging.
 */
export const getErrorDetails = (error: any): Record<string, any> => {
  if (!error) return {};

  const details: Record<string, any> = {};
  if (error.details) details.details = error.details;
  if (error.hint) details.hint = error.hint;
  if (error.code) details.code = error.code;
  if (error.name) details.name = error.name;
  if (error.response) details.response = error.response;

  return details;
};
