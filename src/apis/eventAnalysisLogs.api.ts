import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const eventAnalysisLogsApi = {
  fetchLogs: async (options: DataGridQueryOptions = {}) => {
    return getDBData("event_analysis_logs", options);
  },
};

export default eventAnalysisLogsApi;
