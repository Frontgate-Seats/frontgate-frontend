import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

// types/events.ts (frontend)
export interface IEvent {
  _id: string; // MongoDB ObjectId as string
  eventId: string;
  name: string;

  // References
  venueId: string;
  venueDBId: any; // simplified type, or create IVenue frontend type

  performerIds: string[];
  performerDBIds: any[]; // simplified or IPerformer frontend type

  providerDBId?: any;

  // Other values
  utcDate: string; // convert Date -> string
  localDate: string;
  isExpired: boolean;
  isDateTbd: boolean;
  isTimeTbd: boolean;

  disclaimer: string;
  displayCheckoutDisclaimer: boolean;
  webPath: string;

  listingCount: number;
  ticketCount: number;
  exclusiveListingCount: number;

  category: string;
  subCategories: string[];

  currency: string;
  minPrice: number;
  maxPrice: number;
  tags: string[];
}

const eventsApi = {
  fetchEvents: async ({
    page,
    pageSize,
    sortField,
    sortOrder,
    filters,
    search,
  }: DataGridQueryOptions) => {
    const params: any = {
      page,
      pageSize,
    };

    if (sortField) params.sortField = sortField;
    if (sortOrder) params.sortOrder = sortOrder;
    if (filters) params.filters = JSON.stringify(filters); // serialize DataGrid filter model
    if (search) params.search = search;

    return httpClient.get("/events", { params });
  },
};

export default eventsApi;
