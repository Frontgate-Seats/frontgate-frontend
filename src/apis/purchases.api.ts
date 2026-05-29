import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import { getErrorMessage } from "../shared/utils/error.util";

const fetchPurchases = async (options: DataGridQueryOptions) => {
  return getDBData("inventory", options);
};

export const createQuote = async (payload: {
  event_id: string;
  listing_id: string;
  delivery_id: string;

  quantity: number;

  exclusiveListings?: boolean;
  shippingCountry?: string;
}) => {
  try {
    const response = await supabaseHttpClient.post(
      `/functions/v1/events-api/quote`,
      { data: payload },
    );
    return response;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

export const createOrder = async (payload: {
  // Event
  event_id: string;
  event_name: string;
  event_utc_date: string;

  // Venue
  venue_id: string;
  venue_name: string;

  // Performer
  primary_performer_name: string;

  // Listing
  listing_id: string;
  delivery_id: string;
  quote_id: string;
  section: string;
  row: string;

  // Pricing
  total_amount: number;
  quantity: number;
  price_per: number;


  currency?: string;
}) => {
  try {
    const response = await supabaseHttpClient.post(
      `/functions/v1/events-api/order`,
      { data: payload },
    );
    return response;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const purchasesApi = {
  fetchPurchases,
  createQuote,
  createOrder,
};

export default purchasesApi;
