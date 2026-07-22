import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getErrorMessage } from "../shared/utils/error.util";

export interface StubHubListingRow {
  listingId: string | null;
  /** Native StubHub section name. */
  section_name: string;
  row: string | null;
  /** Platform-base ask (canonical competitor price). */
  price: number;
  /** Buyer-visible fee-inclusive ask; null when not supplied. */
  priceWithFees: number | null;
  quantity: number;
  ticketClassName: string | null;
  isSeatedTogether: boolean | null;
  currency: string | null;
  _source: "stubhub";
}

/**
 * Fetch live StubHub listings for a native StubHub event ID.
 * Caller resolves events_external_mapping first (same pattern as stubhubSales.api.ts).
 * Returns an empty array on failure so it never breaks the listings page.
 */
export const fetchStubHubListings = async (
  stubhubEventId: string,
): Promise<StubHubListingRow[]> => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/stubhub-listings/${stubhubEventId}`,
    );
    return response?.data?.listings ?? [];
  } catch (error: any) {
    const message = getErrorMessage(error);
    console.warn("[StubHub Listings] Failed:", message);
    return [];
  }
};

const stubhubListingsApi = { fetchStubHubListings };
export default stubhubListingsApi;
