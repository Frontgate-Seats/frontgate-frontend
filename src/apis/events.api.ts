import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const eventsApi = {
  fetchEvents: async ({
    page,
    pageSize,
    sortField,
    sortOrder,
    filters,
    search,
  }: DataGridQueryOptions) => {

    const params = {
      page,
      pageSize,
      sortField,
      sortOrder,
      filters: JSON.stringify(filters),
      search,
    };

    return httpClient.get("/events", { params });
  },
};

export default eventsApi;
