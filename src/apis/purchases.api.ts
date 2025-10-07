import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const purchasesApi = {
  fetchPurchases: async ({
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

    return httpClient.get("/purchases", { params });
  },
  createPurchase: async (
    data: {
      quantity: number,
      row: string,
      section: string,
      eventId: string,
      eventDBId: string,
      venueId: string,
      venueDBId: string,
      performerId: string,
      performerDBId: string,
      listingId: string,
      listingDBId: string,
      providerDBId: string,
    }) => {
 
    return httpClient.post("/purchases/order", data);
  },
};

export default purchasesApi;
