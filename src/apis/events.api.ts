import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const eventsApi = {
  fetchEvents: async ({
    page,
    pageSize,
    sortFields,
    filters,
    search,
  }: DataGridQueryOptions) => {
    const params = {
      page,
      pageSize,
      ...(sortFields ? { sortFields: JSON.stringify(sortFields) } : []),
      ...(filters ? { filters: JSON.stringify(filters) } : []),
      search,
    };

    return httpClient.get("/events", { params });
  },
};

export default eventsApi;
