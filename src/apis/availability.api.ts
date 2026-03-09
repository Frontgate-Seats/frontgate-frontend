import supabaseClient from "../clients/supabase.client";

const availabilityApi = {
  // Fetch primary market availability data using tj-availability-info endpoint
  fetchAvailability: async (eventId: string, lastHoursCount: number = 24) => {
    const { data, error } = await supabaseClient.functions.invoke(
      `events-api/tj-availability-info?skyboxEventId=${eventId}&lastHoursCount=${lastHoursCount}&includeFirstSnapshot=false`,
      { method: "GET" }
    );

    if (error) {
      throw new Error(error.message || "Failed to fetch availability data");
    }

    return data;
  },
};

export default availabilityApi;
