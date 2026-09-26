import supabaseHttpClient from "../clients/supabaseHttp.client";
import supabaseClient from "../clients/supabase.client";
import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import type { LlmResultComment } from "../shared/types/trade.types";
import { getErrorMessage } from "../shared/utils/error.util";

const fetchPurchases = async (options: DataGridQueryOptions) => {
  return getDBData("inventory", options);
};

/**
 * Persist the human feedback comment on a purchase (inventory row).
 * Stored on inventory.llm_result_comment using the same
 * { human_comment, ai_comment } shape as trade recommendations, so the
 * downstream repricing/learning AI can read it the same way.
 */
export const updatePurchaseComment = async (
  purchaseRowId: string,
  comment: LlmResultComment,
) => {
  const { data, error } = await supabaseClient
    .from("inventory")
    .update({ llm_result_comment: comment })
    .eq("id", purchaseRowId)
    .select("id, llm_result_comment")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }
  return data;
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

  // Auto trade flag
  is_auto_trade?: boolean;

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

export const updateInventoryPrice = async (payload: {
  inventoryId: number;
  listPrice: number;
}) => {
  try {
    const { inventoryId, listPrice } = payload;
    const response = await supabaseHttpClient.put(
      `/functions/v1/events-api/inventory/${inventoryId}/price`,
      { listPrice },
    );
    return response;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const purchasesApi = {
  fetchPurchases,
  updatePurchaseComment,
  createQuote,
  createOrder,
  updateInventoryPrice,
};

export default purchasesApi;
