import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";

const eventsApi = {
  // Main events fetcher with enhanced search
  fetchEvents: async (options: DataGridQueryOptions = {}) => {
    return getDBData("events", options)
  },

  // Start monitoring for an event
  startMonitoring: async (eventId: string, monitorLevel: string = "medium") => {
    const { data, error } = await supabaseClient
      .from("events")
      .update({ is_monitored: true, monitor_level: monitorLevel })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return data;
  },

  // Stop monitoring for an event
  stopMonitoring: async (eventId: string) => {
    const { data, error } = await supabaseClient
      .from("events")
      .update({ is_monitored: false, monitor_level: "none" })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return data;
  },
};

export default eventsApi;