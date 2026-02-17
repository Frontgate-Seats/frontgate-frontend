import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";

const sgeventsApi = {
  // Fetch SeatGeek events
  fetchSGEvents: async (options: DataGridQueryOptions = {}) => {
    return getDBData("sgevents", options);
  },

  // Fetch a single SeatGeek event by ID
  fetchSGEvent: async (eventId: string) => {
    const { data, error } = await supabaseClient
      .from("sgevents")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      throw new Error(error.message || "Failed to fetch SeatGeek event");
    }

    return data;
  },
};

export default sgeventsApi;