import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const eventsExternalMappingsApi = {
  fetchEventsExternalMappings: async (options: DataGridQueryOptions = {}) => {
    return getDBData("events_external_mapping", options);
  },
};

export default eventsExternalMappingsApi;
