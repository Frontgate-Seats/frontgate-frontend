import * as React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { getEvents } from "../store/slices/events.slice";
import { getSGEvent } from "../store/slices/sgevents.slice";
import { getEventsExternalMappings } from "../store/slices/eventsExternalMappings.slice";
import { getSales } from "../store/slices/sales.slice";
import { getListingTrends } from "../store/slices/listingTrends.slice";

export function useUnifiedEventData(eventId: string | undefined) {
  const dispatch = useAppDispatch();

  const events = useSelector((state: RootState) => state.events);
  const sgevents = useSelector((state: RootState) => state.sgevents);
  const sales = useSelector((state: RootState) => state.sales);
  const eventsExternalMappings = useSelector(
    (state: RootState) => state.eventsExternalMappings
  );
  const listingTrends = useSelector((state: RootState) => state.listingTrends);

  // Try to find event in both sources
  const selectedEvent = React.useMemo(() => {
    if (!eventId) return null;
    
    // First try to find in events table (Vivid events)
    const vividEvent = events.rows.data.find((e) => e.id.toString() === eventId);
    if (vividEvent) {
      return { ...vividEvent, source: 'events' as const };
    }
    
    // Then try to find in sgevents table (SeatGeek events)
    const sgEvent = sgevents.rows.data.find((e) => e.id.toString() === eventId);
    if (sgEvent) {
      return { ...sgEvent, source: 'sgevents' as const, platform: 'seatgeek' };
    }
    
    return null;
  }, [events.rows.data, sgevents.rows.data, eventId]);

  const fetchEvent = React.useCallback(() => {
    if (!eventId) return;
    
    // Try to fetch from events table first
    dispatch(
      getEvents({
        page: 0,
        pageSize: 1,
        sortFields: [{ field: "local_date", sort: "asc" }],
        filters: {
          items: [{ field: "id", operator: "equals", value: eventId }],
        },
      })
    );
    
    // Also try to fetch from sgevents table
    // Note: This assumes eventId is numeric for sgevents
    if (!isNaN(Number(eventId))) {
      dispatch(getSGEvent(eventId));
    }
  }, [dispatch, eventId]);

  const fetchExternalMappings = React.useCallback(() => {
    if (!eventId) return;
    dispatch(
      getEventsExternalMappings({
        filters: {
          items: [{ field: "event_id", operator: "equals", value: eventId }],
        },
      })
    );
  }, [dispatch, eventId]);

  const fetchSales = React.useCallback(() => {
    const external_event_id =
      eventsExternalMappings.rows.data?.[0]?.external_event_id?.toString();
    if (!external_event_id) return;
    dispatch(getSales(external_event_id));
  }, [dispatch, eventsExternalMappings.rows.data]);

  const fetchListingTrends = React.useCallback(() => {
    if (!eventId) return;
    dispatch(getListingTrends(eventId));
  }, [dispatch, eventId]);

  // Initial fetch
  React.useEffect(() => {
    if (eventId && !selectedEvent) {
      fetchEvent();
    }
  }, [eventId, selectedEvent, fetchEvent]);

  React.useEffect(() => {
    if (eventId) {
      fetchExternalMappings();
      fetchListingTrends();
    }
  }, [eventId, fetchExternalMappings, fetchListingTrends]);

  React.useEffect(() => {
    if (eventsExternalMappings.rows.data?.length) {
      fetchSales();
    }
  }, [eventsExternalMappings.rows.data, fetchSales]);

  // Auto-refresh
  React.useEffect(() => {
    if (!eventsExternalMappings.rows.data?.length) return;
    const intervalId = setInterval(fetchSales, 600000);
    return () => clearInterval(intervalId);
  }, [eventsExternalMappings.rows.data?.length, fetchSales]);

  React.useEffect(() => {
    if (!eventId) return;
    const intervalId = setInterval(fetchListingTrends, 600000);
    return () => clearInterval(intervalId);
  }, [eventId, fetchListingTrends]);

  return {
    selectedEvent,
    events: events.rows.data,
    sgevents: sgevents.rows.data,
    sales: sales.rows.data,
    listingTrends: listingTrends.rows.data,
    loading: {
      events: events.loading || sgevents.loading,
      sales: sales.loading,
      listingTrends: listingTrends.loading,
    },
    error: {
      events: events.error || sgevents.error,
      sales: sales.error,
    },
    refetch: {
      event: fetchEvent,
      sales: fetchSales,
      listingTrends: fetchListingTrends,
    },
  };
}