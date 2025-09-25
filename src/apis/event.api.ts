import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";

export interface Event {
    id: number;
    eventName: string;
    performerName: string;
    eventDate: string;
    eventTime: string;
    section: string;
    row: string;
    price: string;
}

// Backend is expected to return: { data: Event[], total: number }
export const fetchEvents = async (page: number, pageSize: number): Promise<{ data: Event[]; total: number }> => {
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


const eventApi = {
    fetchEvents
};
export default eventApi;

