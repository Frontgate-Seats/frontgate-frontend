import supabaseClient from "../clients/supabase.client";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";

/**
 * Extracts the error message from a Supabase functions.invoke() error.
 * - FunctionsHttpError: function ran but returned 4xx/5xx — body is in error.context
 * - FunctionsRelayError: network issue between client and Supabase
 * - FunctionsFetchError: function couldn't be reached at all
 */
export const getSupabaseFunctionError = async (error: unknown): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.error || body?.message || JSON.stringify(body) || error.message;
    } catch {
      // body wasn't JSON — try plain text
      try {
        const text = await error.context.text();
        return text || error.message;
      } catch {
        return error.message;
      }
    }
  }
  if (error instanceof FunctionsRelayError) {
    return `Relay error: ${(error as any).message}`;
  }
  if (error instanceof FunctionsFetchError) {
    return `Fetch error: ${(error as any).message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
};

const availabilityApi = {
  fetchAvailability: async (eventId: string, lastHoursCount: number = 24) => {
    const { data, error } = await supabaseClient.functions.invoke(
      `events-api/tj-availability-info?skyboxEventId=${eventId}&lastHoursCount=${lastHoursCount}&includeFirstSnapshot=false`,
      { method: "GET" }
    );

    if (error) {
      const message = await getSupabaseFunctionError(error);
      throw new Error(message);
    }

    return data;
  },
};

export default availabilityApi;
