import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";

export type IPriceStats = {
  average: number;
  max: number;
  min: number;
  median: number;
};

export type IListing = {
  eventId: string;
  venueId: string;
  performerId: string;

  providerDBId: string; // in frontend, usually just the ID or you can type a provider object

  // Meta info about the event/listings
  listingCount: number;
  ticketCount: number;
  maxTicketCount: number;
  daysToEvent: number;

  showAllInPrice: boolean;
  showFaceValue: boolean;
  showServiceCharge: boolean;
  showAipIncludedPrices: boolean;

  aipIncludedPrices: string;

  allInPrice: IPriceStats;
  price: IPriceStats;
  getInPrice: IPriceStats;
  twoPlusPrice: IPriceStats;
};

// Backend is expected to return: { data: Event[], total: number }
export const fetchListings = async ({
  page,
  pageSize,
  sortField,
  sortOrder,
  filters,
  search,
}: DataGridQueryOptions) => {
  try {
    const params: any = {
      page,
      pageSize,
    };

    if (sortField) params.sortField = sortField;
    if (sortOrder) params.sortOrder = sortOrder;
    if (filters) params.filters = JSON.stringify(filters); // serialize DataGrid filter model
    if (search) params.search = search;

    console.log("params : ",params)
    const response = await httpClient.get("/listings", { params });
    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    throw error.response?.data || new Error("Failed to fetch listings");
  }
};

const listingsApi = {
  fetchListings,
};
export default listingsApi;
