import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";

export type IPerformer = {
  performerId: string;
  name: string;
  isPrimary: boolean;
  isHome: boolean;
};

export type IVenue = {
  venueId: string;
  name: string;

  latitude: number;
  longitude: number;

  address: IVenueAddress;
  regionId: string;
  url?: string;
  timezone: string;
  disclaimer: string;
};

export type IVenueAddress = {
  addressLine: string;
  city: string;
  stateCode: string;
  postalCode: string;
  countryCode: string;
  regionId: string;
};

export type IEvents = {
  eventId: string;
  name: string;

  // REFRANCES
  venueId: string;
  venueDBId: IVenue;

  performerIds: string[];
  performerDBIds: IPerformer[];

  // OTHER VALUES
  utcDate: Date;
  localDate: Date;
  isExpired: boolean;
  isDateTbd: boolean;
  isTimeTbd: boolean;
  updatedAt: Date;
  disclaimer: string;
  displayCheckoutDisclaimer: boolean;
  webPath: string;
  inventory: IEventInventory;
  pricing: IEventPricing;
  category: IEventCategory;
  tags: string[];
};

export type IEventInventory = {
  listingCount: number;
  ticketCount: number;
  exclusiveListingCount: number;
};

export type IEventPricing = {
  currency: string;
  min: number;
  max: number;
};

export type IEventCategory = {
  id: string;
  name: string;
  subCategories: {
    id: string;
    name: string;
  }[];
};

// Backend is expected to return: { data: Event[], total: number }
export const fetchEvents = async (
  page: number,
  pageSize: number
): Promise<{ data: IEvents[]; total: number }> => {
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
