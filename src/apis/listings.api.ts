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
        sectionName: d.section.name,
      })) || [],
    total: response?.data?.listings?.length || 0,
  };
};

export const fetchListingsDetails = async (payload: {
  listingDBId: string;
  listingId: string;
  quantity: number;
  shippingCountry?: string;
  exclusiveListings?: boolean;
}) => {
  return httpClient.get("/listings/details", { params: payload });
};

const listingsApi = {
  fetchListings,
  fetchListingsDetails,
};
export default listingsApi;
