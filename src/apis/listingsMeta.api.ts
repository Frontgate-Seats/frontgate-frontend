import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

// Backend is expected to return: { data: Event[], total: number }
export const fetchListingsMeta = async ({
  page,
  pageSize,
  sortField,
  sortOrder,
  filters,
  search,
}: DataGridQueryOptions) => {
  try {
    const params = {
      page,
      pageSize,
      sortField,
      sortOrder,
      filters: JSON.stringify(filters),
      search,
    };

    const response = await httpClient.get("/listingsMeta", { params });
    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    throw error.response?.data || new Error("Failed to fetch listingsMeta");
  }
};

const listingsMetaApi = {
  fetchListingsMeta,
};
export default listingsMetaApi;
