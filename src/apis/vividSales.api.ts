import supabaseHttpClient from "../clients/supabaseHttp.client";

// Backend is expected to return: { data: VividSales[], total: number }
export const fetchVividSales = async (eventId: string) => {
  const response = await supabaseHttpClient.get(
    `/functions/v1/events-api/vivid-sales/${eventId}`,
  );

  return {
    data: response.data.sales?.aggregates || [],
    total: response.data.sales?.aggregates?.length || 0,
  };
};

const vividSalesApi = {
  fetchVividSales,
};

export default vividSalesApi;
