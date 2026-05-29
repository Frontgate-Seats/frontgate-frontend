import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getErrorMessage } from "../shared/utils/error.util";

// Backend is expected to return: { data: Event[], total: number }
export const fetchListings = async (event_id: string) => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/listings/${event_id}`,
    );

    return {
      data:
        response?.data?.listings?.map((d: any) => ({
          ...d,
          section_name: d.section.name,
        })) || [],
      total: response?.data?.listings?.length || 0,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

export const fetchListingsDetails = async (payload: {
  event_id: string;
  listing_id: string;
  quantity: number;
  shippingCountry?: string;
  exclusiveListings?: boolean;
}) => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/listingsDetails`,
      { params: payload },
    );
    return response;
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const listingsApi = {
  fetchListings,
  fetchListingsDetails,
};
export default listingsApi;
