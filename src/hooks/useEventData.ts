import * as React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { getEvents } from "../store/slices/events.slice";
import { getSGEvent } from "../store/slices/sgevents.slice";
import { getEventsExternalMappings } from "../store/slices/eventsExternalMappings.slice";
import { getSales } from "../store/slices/sales.slice";
import { getVividSales } from "../store/slices/vividSales.slice";
import { getListingTrends } from "../store/slices/listingTrends.slice";
import { getStubhubEvent } from "../store/slices/stubhubEvents.slice";
import { getStubhubSales } from "../store/slices/stubhubSales.slice";

export function useEventData(eventId: string | undefined) {
  const dispatch = useAppDispatch();

  const events = useSelector((state: RootState) => state.events);
  const sgevents = useSelector((state: RootState) => state.sgevents);
  const sales = useSelector((state: RootState) => state.sales);
  const vividSales = useSelector((state: RootState) => state.vividSales);
  const eventsExternalMappings = useSelector(
    (state: RootState) => state.eventsExternalMappings,
  );
  const listingTrends = useSelector((state: RootState) => state.listingTrends);
  const stubhubEvents = useSelector((state: RootState) => state.stubhubEvents);
  const stubhubSales = useSelector((state: RootState) => state.stubhubSales);

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

    // Get external event ID from seatgeek mappings
    const seatgeekMapping = eventsExternalMappings.rows.data?.find(
      (m: any) => m.external_platform === "seatgeek"
    );
    const externalEventId = seatgeekMapping?.external_event_id?.toString();
    if (!externalEventId) return null;

    // Find the SeatGeek event
    return sgevents.rows.data.find((e) => e.id.toString() === externalEventId);
  }, [selectedEvent, eventsExternalMappings.rows.data, sgevents.rows.data]);

  // Find matched StubHub event from external mappings
  const matchedStubhubEvent = React.useMemo(() => {
    return stubhubEvents.data ?? null;
  }, [stubhubEvents.data]);

  // Get StubHub external event ID from mappings
  const stubhubExternalEventId = React.useMemo(() => {
    const stubhubMapping = eventsExternalMappings.rows.data?.find(
      (m: any) => m.external_platform === "stubhub"
    );
    return stubhubMapping?.external_event_id?.toString() ?? null;
  }, [eventsExternalMappings.rows.data]);

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
    const seatgeekMapping = eventsExternalMappings.rows.data?.find(
      (m: any) => m.external_platform === "seatgeek"
    );
    const external_event_id = seatgeekMapping?.external_event_id?.toString();
    if (!external_event_id) return;
    dispatch(getSales(external_event_id));
  }, [dispatch, eventsExternalMappings.rows.data]);

  const fetchStubhubSales = React.useCallback(() => {
    const stubhubMapping = eventsExternalMappings.rows.data?.find(
      (m: any) => m.external_platform === "stubhub"
    );
    const stubhubEventId = stubhubMapping?.external_event_id?.toString();
    if (!stubhubEventId) return;
    dispatch(getStubhubSales(stubhubEventId));
  }, [dispatch, eventsExternalMappings.rows.data]);

  const fetchListingTrends = React.useCallback(() => {
    if (!eventId) return;
    dispatch(getListingTrends(eventId));
  }, [dispatch, eventId]);

  const fetchVividSales = React.useCallback(() => {
    if (!eventId) return;
    dispatch(getVividSales(eventId));
  }, [dispatch, eventId]);

  // Fetch matched SeatGeek event when we have external mapping
  React.useEffect(() => {
    const seatgeekMapping = eventsExternalMappings.rows.data?.find(
      (m: any) => m.external_platform === "seatgeek"
    );
    const externalEventId = seatgeekMapping?.external_event_id?.toString();
    if (externalEventId && !isNaN(Number(externalEventId))) {
      dispatch(getSGEvent(externalEventId));
    }
  }, [dispatch, eventsExternalMappings.rows.data]);

  // Fetch matched StubHub event when we have external mapping
  React.useEffect(() => {
    const stubhubMapping = eventsExternalMappings.rows.data?.find(
      (m: any) => m.external_platform === "stubhub"
    );
    const stubhubEventId = stubhubMapping?.external_event_id?.toString();
    if (stubhubEventId) {
      dispatch(getStubhubEvent(stubhubEventId));
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
      fetchVividSales();
    }
  }, [eventId, fetchExternalMappings, fetchListingTrends, fetchVividSales]);

  React.useEffect(() => {
    if (eventsExternalMappings.rows.data?.length) {
      fetchSales();
      fetchStubhubSales();
    }
  }, [eventsExternalMappings.rows.data, fetchSales, fetchStubhubSales]);

  // Auto-refresh sales & listing trends removed — this data is historical
  // and does not change frequently enough to justify background polling.
  // Users can refresh manually via the refresh button.

  return {
    selectedEvent,
    matchedSeatGeekEvent,
    matchedStubhubEvent,
    stubhubExternalEventId,
    events: events.rows.data,
    sales: sales.rows.data,
    vividSales: vividSales.rows.data,
    stubhubSales: stubhubSales.rows.data,
    listingTrends: listingTrends.rows.data,
    loading: {
      events: events.loading || sgevents.loading,
      sales: sales.loading,
      vividSales: vividSales.loading,
      stubhubSales: stubhubSales.loading,
      stubhubEvents: stubhubEvents.loading,
      listingTrends: listingTrends.loading,
    },
    error: {
      events: events.error || sgevents.error,
      sales: sales.error,
      vividSales: vividSales.error,
      stubhubSales: stubhubSales.error,
    },
    refetch: {
      event: fetchEvent,
      sales: fetchSales,
      vividSales: fetchVividSales,
      stubhubSales: fetchStubhubSales,
      listingTrends: fetchListingTrends,
    },
  };
}
