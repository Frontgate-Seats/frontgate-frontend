import httpClient from "../clients/http.client";
import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

const fetchPurchases = async (options: DataGridQueryOptions) => {
  return getDBData("inventory", options);
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
  createOrder,
};

export default purchasesApi;
