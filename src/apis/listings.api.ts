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

// Fetch listings with full map data (groups/zones, sections, SVG URL)
export const fetchListingsWithMap = async (event_id: string) => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/listings/${event_id}`,
    );

    const responseData = response?.data;

    const listings =
      responseData?.listings?.map((d: any) => ({
        ...d,
        section_name: d.section?.name,
      })) || [];

    // Map data can come from:
    // 1. response.data.map (backend returns full map object)
    // 2. response.data.jsonMapUrl / response.data.staticUrl (top-level URLs)
    const mapObj = responseData?.map || null;
    const jsonMapUrl = mapObj?.jsonMapUrl || responseData?.jsonMapUrl || null;
    const staticUrl = mapObj?.staticUrl || responseData?.staticUrl || null;

    // Construct full map data if we have any map info
    const map = mapObj
      ? {
          jsonMapUrl,
          staticUrl,
          patternSize: mapObj.patternSize,
          zoomFactor: mapObj.zoomFactor,
          zoomXoff: mapObj.zoomXoff,
          zoomYoff: mapObj.zoomYoff,
          groups: mapObj.groups || [],
          sections: mapObj.sections || [],
        }
      : jsonMapUrl || staticUrl
        ? { jsonMapUrl, staticUrl, groups: [], sections: [] }
        : null;

    return {
      listings,
      map,
      jsonMapUrl,
      staticUrl,
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
  fetchListingsWithMap,
  fetchListingsDetails,
};
export default listingsApi;
