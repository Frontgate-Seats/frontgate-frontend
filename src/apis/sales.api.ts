import supabaseHttpClient from "../clients/supabaseHttp.client";

// Backend is expected to return: { data: Event[], total: number }
export const fetchSales = async (event_id: string) => {
  console.log("called");

  const response = await supabaseHttpClient.get(
    `/functions/v1/events-api/sales/${event_id}`,
  );

  return {
    data: response.data.sales || [],
    total: response.data.sales.length || 0,
  };
};

const salesApi = {
  fetchSales,
};
export default salesApi;
