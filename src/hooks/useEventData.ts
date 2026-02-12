import * as React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { getEvents } from "../store/slices/events.slice";
import { getEventsExternalMappings } from "../store/slices/eventsExternalMappings.slice";
import { getSales } from "../store/slices/sales.slice";
import { getListingTrends } from "../store/slices/listingTrends.slice";
import { getSuggests } from "../store/slices/suggests.slice";

export function useEventData(eventId: string | undefined) {
  const dispatch = useAppDispatch();

  const events = useSelector((state: RootState) => state.events);
  const sales = useSelector((state: RootState) => state.sales);
  const eventsExternalMappings = useSelector(
    (state: RootState) => state.eventsExternalMappings
  );
  const listingTrends = useSelector((state: RootState) => state.listingTrends);
  const suggests = useSelector((state: RootState) => state.suggests);

  const selectedEvent = React.useMemo(
    () => events.rows.data.find((e) => e.id.toString() === eventId),
    [events.rows.data, eventId]
  );

  const fetchEvent = React.useCallback(() => {
    if (!eventId) return;
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

  const fetchSuggests = React.useCallback(() => {
    if (!eventId) return;
    dispatch(
      getSuggests({
        filters: {
          items: [{ field: "event_id", operator: "equals", value: eventId }],
        },
      })
    );
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
      fetchSuggests();
    }
  }, [eventId, fetchExternalMappings, fetchListingTrends, fetchSuggests]);

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
    sales: sales.rows.data,
    listingTrends: listingTrends.rows.data,
    suggests: suggests.rows.data,
    loading: {
      events: events.loading,
      sales: sales.loading,
      listingTrends: listingTrends.loading,
      suggests: suggests.loading,
    },
    error: {
      events: events.error,
      sales: sales.error,
      suggests: suggests.error,
    },
    refetch: {
      event: fetchEvent,
      sales: fetchSales,
      listingTrends: fetchListingTrends,
      suggests: fetchSuggests,
    },
  };
}
