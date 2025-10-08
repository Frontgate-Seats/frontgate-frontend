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

export const fetchListingsDetails = async (payload: {
  listingDBId: string;
  listingId: string;
  quantity: number;
  shippingCountry?: string;
  exclusiveListings?: boolean;
}) => {
  return httpClient.get("/listings/details", { params: payload });
};

const listingsApi = {
  fetchListings,
  fetchListingsDetails,
};
export default listingsApi;
