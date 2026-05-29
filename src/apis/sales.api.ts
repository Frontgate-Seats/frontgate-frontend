import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getErrorMessage } from "../shared/utils/error.util";

// Backend is expected to return: { data: Event[], total: number }
export const fetchSales = async (external_event_id: string) => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/sales/${external_event_id}`,
    );

    return {
      data: response.data.sales || [],
      total: response.data.sales.length || 0,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const salesApi = {
  fetchSales,
};
export default salesApi;
