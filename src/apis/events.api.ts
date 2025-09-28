import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";

export const fetchEvents = async (page: number, pageSize: number) => {
  try {
    const response = await httpClient.get("/events", {
      params: { page, pageSize },
    });
    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    throw error.response?.data || new Error("Failed to fetch events");
  }
};

const eventsApi = {
  fetchEvents,
};
export default eventsApi;
