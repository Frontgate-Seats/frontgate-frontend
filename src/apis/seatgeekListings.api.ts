import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getErrorMessage } from "../shared/utils/error.util";

export interface SeatGeekListingRow {
  listingId: string;
  /** Native SeatGeek section name. */
  section_name: string;
  row: string | null;
  quantity: number;
  /** Seller-net base price (canonical competitor price). */
  price: number;
  /** Buyer-visible fee-inclusive ask; null when not supplied. */
  priceWithFees: number | null;
  deliveryMethod: string | null;
  note: string | null;
  splits: number[];
  inHandDate: string | null;
  _source: "seatgeek";
}

/**
 * Fetch live SeatGeek listings for a native SeatGeek event ID.
 * Caller resolves the mapping first (same pattern as salesApi.fetchSales).
 * Returns an empty array on failure so it never breaks the listings page.
 */
export const fetchSeatGeekListings = async (
  sgEventId: string,
): Promise<SeatGeekListingRow[]> => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/seatgeek-listings/${sgEventId}`,
    );
    return response?.data?.listings ?? [];
  } catch (error: any) {
    const message = getErrorMessage(error);
    console.warn("[SeatGeek Listings] Failed:", message);
    return [];
  }
};

const seatgeekListingsApi = { fetchSeatGeekListings };
export default seatgeekListingsApi;
