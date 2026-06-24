import * as React from "react";

export interface PurchaseListingData {
  id: string;
  row: string;
  section_name: string;
  price: number;
  quantity?: number;
  splits?: number[];
}

export interface PurchaseEventData {
  id: string;
  name: string;
  utc_date?: string;
  venue_id?: string;
  venue_name?: string;
  primary_performer_name?: string;
  local_date?: string;
  /** External event URL (e.g. VividSeats event page) */
  event_url?: string;
}

interface PurchaseModalContextType {
  openPurchaseModal: (listing: PurchaseListingData, event: PurchaseEventData) => void;
  closePurchaseModal: () => void;
}

export const PurchaseModalContext = React.createContext<PurchaseModalContextType>({
  openPurchaseModal: () => {},
  closePurchaseModal: () => {},
});

export const usePurchaseModal = () => React.useContext(PurchaseModalContext);
