import httpClient from "../clients/http.client";
import supabaseHttpClient from "../clients/supabaseHttp.client";

// Backend is expected to return: { data: Event[], total: number }
export const fetchListings = async (event_id: string) => {
  const response = await supabaseHttpClient.get(
    `/functions/v1/events-api/listings/${event_id}`,
  );
  console.log("response : ", response);

  return {
    data:
      response?.data?.listings?.map((d: any) => ({
        ...d,
        section_name: d.section.name,
      })) || [],
    total: response?.data?.listings?.length || 0,
  };
};

export const fetchListingsDetails = async (payload: {
  event_id: string;
  listing_id: string;
  quantity: number;
  shippingCountry?: string;
  exclusiveListings?: boolean;
}) => {
  const response = await supabaseHttpClient.get(
    `/functions/v1/events-api/listingsDetails`,
    { params: payload },
  );
  return response;
};

const listingsApi = {
  fetchListings,
  fetchListingsDetails,
};
export default listingsApi;
