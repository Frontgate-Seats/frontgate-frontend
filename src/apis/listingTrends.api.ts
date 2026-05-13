import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";

export const fetchListingTrends = async (event_id: string) => {
  try {
    const { data, error } = await supabaseClient
      .from("listings_sections_trends")
      .select(`
        id,
        event_id,
        section_name,
        platform,
        min_price_all,
        min_price_pair,
        sec_min_price_pair,
        median_price_pair,
        sec_ticket_count,
        sec_listing_count,
        created_at
      `)
      .eq("event_id", event_id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return {
      data: data || [],
      total: data?.length || 0,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const listingTrendsApi = {
  fetchListingTrends,
};
export default listingTrendsApi;
