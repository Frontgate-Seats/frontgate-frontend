import httpClient from "../clients/http.client";

const eventsApi = {
  fetchEvents: async (
    page: number,
    pageSize: number,
    sortField?: string,
    sortOrder?: "asc" | "desc",
    filters?: any,
    search?: string
  ) => {
    const params: any = {
      page,
      pageSize,
    };

    if (sortField) params.sortField = sortField;
    if (sortOrder) params.sortOrder = sortOrder;
    if (filters) params.filters = JSON.stringify(filters); // serialize DataGrid filter model
    if (search) params.search = search;

    return httpClient.get("/events", { params });
  },
};

export default eventsApi;
