import * as React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { getEvents } from "../store/slices/events.slice";
import { getSGEvent } from "../store/slices/sgevents.slice";
import { getEventsExternalMappings } from "../store/slices/eventsExternalMappings.slice";
import { getSales } from "../store/slices/sales.slice";
import { getListingTrends } from "../store/slices/listingTrends.slice";

export function useEventData(eventId: string | undefined) {
  const dispatch = useAppDispatch();

  const events = useSelector((state: RootState) => state.events);
  const sgevents = useSelector((state: RootState) => state.sgevents);
  const sales = useSelector((state: RootState) => state.sales);
  const eventsExternalMappings = useSelector(
    (state: RootState) => state.eventsExternalMappings,
  );
  const listingTrends = useSelector((state: RootState) => state.listingTrends);

  // Try to find event in both events and sgevents tables
  const selectedEvent = React.useMemo(() => {
    if (!eventId) return null;

    // First try to find in events table (Vivid events)
    const vividEvent = events.rows.data.find(
      (e) => e.id.toString() === eventId,
    );
    if (vividEvent) {
      return vividEvent;
    }

    // Then try to find in sgevents table (SeatGeek events)
    const sgEvent = sgevents.rows.data.find((e) => e.id.toString() === eventId);
    if (sgEvent) {
      // Add platform field for SeatGeek events
      return { ...sgEvent, platform: "seatgeek" };
    }

    return null;
  }, [events.rows.data, sgevents.rows.data, eventId]);

  // Find matched SeatGeek event from external mappings
  const matchedSeatGeekEvent = React.useMemo(() => {
    if (!selectedEvent || selectedEvent.platform === "seatgeek") return null;

    // Get external event ID from mappings
    const externalEventId =
      eventsExternalMappings.rows.data?.[0]?.external_event_id?.toString();
    if (!externalEventId) return null;

    // Find the SeatGeek event
    return sgevents.rows.data.find((e) => e.id.toString() === externalEventId);
  }, [selectedEvent, eventsExternalMappings.rows.data, sgevents.rows.data]);

  const fetchEvent = React.useCallback(() => {
    if (!eventId) return;

    // Try to fetch from events table (Vivid events)
    dispatch(
      getEvents({
        page: 0,
        pageSize: 1,
        sortFields: [{ field: "local_date", sort: "asc" }],
        filters: {
          items: [{ field: "id", operator: "equals", value: eventId }],
        },
      }),
    );
  }, [dispatch, eventId]);

  const fetchExternalMappings = React.useCallback(() => {
    if (!eventId) return;
    dispatch(
      getEventsExternalMappings({
        filters: {
          items: [{ field: "event_id", operator: "equals", value: eventId }],
        },
      }),
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

  // Fetch matched SeatGeek event when we have external mapping
  React.useEffect(() => {
    const externalEventId =
      eventsExternalMappings.rows.data?.[0]?.external_event_id?.toString();
    if (externalEventId && !isNaN(Number(externalEventId))) {
      dispatch(getSGEvent(externalEventId));
    }
  }, [dispatch, eventsExternalMappings.rows.data]);

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
    matchedSeatGeekEvent,
    events: events.rows.data,
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
