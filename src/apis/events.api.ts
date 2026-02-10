import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";

const eventsApi = {
  // Main events fetcher with enhanced search
  fetchEvents: async (options: DataGridQueryOptions = {}) => {
    return getDBData("events", options)
  },

  // Start monitoring for an event
  startMonitoring: async (eventId: string) => {
    const { data, error } = await supabaseClient
      .from("events")
      .update({ is_monitored: true })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to start monitoring");
    }

    return data;
  },

  // Stop monitoring for an event
  stopMonitoring: async (eventId: string) => {
    const { data, error } = await supabaseClient
      .from("events")
      .update({ is_monitored: false })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to stop monitoring");
    }

    return data;
  },
};

export default eventsApi;