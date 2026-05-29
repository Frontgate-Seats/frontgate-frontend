import supabaseHttpClient from "../clients/supabaseHttp.client";
import { getErrorMessage } from "../shared/utils/error.util";

// Backend is expected to return: { data: VividSales[], total: number }
export const fetchVividSales = async (eventId: string) => {
  try {
    const response = await supabaseHttpClient.get(
      `/functions/v1/events-api/vivid-sales/${eventId}`,
    );

    return {
      data: response.data.sales?.aggregates || [],
      total: response.data.sales?.aggregates?.length || 0,
    };
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const vividSalesApi = {
  fetchVividSales,
};

export default vividSalesApi;
