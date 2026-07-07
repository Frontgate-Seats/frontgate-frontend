import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";

/**
 * Fetch a StubHub event from the stubhubevents table by its StubHub event ID
 */
export const fetchStubhubEvent = async (stubhubEventId: string) => {
  try {
    const { data, error } = await supabaseClient
      .from("stubhubevents")
      .select("*")
      .eq("id", stubhubEventId)
      .maybeSingle();

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return data;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const stubhubEventsApi = {
  fetchStubhubEvent,
};

export default stubhubEventsApi;
