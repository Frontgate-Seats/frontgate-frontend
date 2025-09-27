import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";

// Main Listing document
export type IListing = {
  eventId: string;
  venueId: string;
  performerId: string;

  // Meta info about the event/listings
  meta: IListingMeta;

  // Array of individual listings
  listings: IListingLinstings[];
};
export type PriceBreakdown = {
  price: number;
  serviceFee: unknown;
  total: number;
};

export type Section = {
  id: number;
  name: string;
  longSectionName: string;
};

// Price stats
export type PriceStats = {
  average: number;
  max: number;
  min: number;
  median: number;
};

export type IListingMeta = {
  listingCount: number;
  ticketCount: number;
  maxTicketCount: number;
  daysToEvent: number;
  pageColor: string;
  showAllInPrice: boolean;
  showFaceValue: boolean;
  showServiceCharge: boolean;
  allInPrice: PriceStats;
  price: PriceStats;
  showAipIncludedPrices: boolean;
  aipIncludedPrices: string;
};

export type IListingLinstings = {
  id: string;
  row: string;
  notes: string;
  quantity: number;
  splits: number[];
  price: number;
  allInPrice: number;
  faceValue: unknown;
  stockType: string;
  inHandDate: string;
  groupId: string;
  isElectronicDelivery: boolean;
  isEticket: boolean;
  isFlashSeats: boolean;
  isInstantDownload: boolean;
  isInstantElectronicTransfer: boolean;
  isMobileScreencap: boolean;
  isWillCall: boolean;
  isZoneSeating: boolean;
  priceBreakdown: PriceBreakdown;
  section: Section;
  featured: boolean;
  tags: string[];
  vs: number;
};

// Backend is expected to return: { data: Event[], total: number }
export const fetchListings = async (
  page: number,
  pageSize: number
): Promise<{ data: IListing[]; total: number }> => {
  try {
    const response = await httpClient.get("/listings", {
      params: { page, pageSize },
    });
    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    throw error.response?.data || new Error("Failed to fetch listings");
  }
};

export const fetchListingsByField = async (
  page: number,
  pageSize: number,
  field: {
    name: string;
    value: any;
  }
): Promise<{ data: IListing[]; total: number }> => {
  try {
    const response = await httpClient.get(
      `/listings/${field.name}/${field.value}`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError;
    throw error.response?.data || new Error("Failed to fetch listings");
  }
};

const listingsApi = {
  fetchListings,
  fetchListingsByField
};
export default listingsApi;
