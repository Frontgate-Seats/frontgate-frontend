import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

// Backend is expected to return: { data: Event[], total: number }
export const fetchListingsMeta = async ({
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

  return httpClient.get("/listingsMeta", { params });
};

const listingsMetaApi = {
  fetchListingsMeta,
};
export default listingsMetaApi;
