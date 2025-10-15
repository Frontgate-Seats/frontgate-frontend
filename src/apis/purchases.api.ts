import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const fetchPurchases = async ({
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
};

export const createQuote = async (payload: {
  listingDBId: string;
  listingId: string;
  deliveryMethodId: string;

  quantity: number;

  exclusiveListings?: boolean;
  shippingCountry?: string;
}) => {
  return httpClient.post("/purchases/quote", payload);
};

export const createOrder = async (payload: {
  listingDBId: string;
  listingId: string;
  deliveryMethodId: string;
  quoteId: string;
  totalAmount: number;
  quantity: number;
  pricePer: number;

  currency?: string;
}) => {
  return httpClient.post("/purchases/order", payload);
};

const purchasesApi = {
  fetchPurchases,
  createQuote,
  createOrder
};

export default purchasesApi;
