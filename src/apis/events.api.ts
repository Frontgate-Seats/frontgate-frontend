import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const eventsApi = {
  // Main events fetcher with enhanced search
  fetchEvents: async (options: DataGridQueryOptions = {}) => {
    return getDBData("events", options)
  },
};

export default eventsApi;