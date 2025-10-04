import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

// Backend is expected to return: { data: Event[], total: number }
export const fetchListings = async ({
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

  return httpClient.get("/listings", { params });
};

const listingsApi = {
  fetchListings,
};
export default listingsApi;
