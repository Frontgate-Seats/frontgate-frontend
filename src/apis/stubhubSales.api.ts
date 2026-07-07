import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getErrorMessage } from "../shared/utils/error.util";

/**
 * Fetch StubHub sales from Ticketmetric API via our backend proxy.
 * Same approach as SeatGeek: pass the StubHub event ID directly.
 * @param stubhubEventId - StubHub event ID (from events_external_mapping)
 */
export const fetchStubhubSales = async (stubhubEventId: string) => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/stubhub-sales/${stubhubEventId}`,
    );

    return {
      data: response.data.sales || [],
      total: response.data.sales?.length || 0,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const stubhubSalesApi = {
  fetchStubhubSales,
};

export default stubhubSalesApi;
