import type { GridFilterModel, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";

export interface Event {
  id: number;
  eventName: string;
  performerName: string;
  eventDate: string; // ISO string
  eventTime: string; // "HH:MM" format
  section: string;
  row: string;
  price: number;
}

const INITIAL_EVENTS_STORE: Event[] = [
  { id: 1, eventName: 'Rock Fiesta', performerName: 'The Rockers', eventDate: '2025-09-20', eventTime: '19:00', section: 'A', row: '1', price: 50 },
  { id: 2, eventName: 'Jazz Night', performerName: 'Smooth Jazz Band', eventDate: '2025-09-21', eventTime: '20:00', section: 'B', row: '3', price: 40 },
  { id: 3, eventName: 'Pop Extravaganza', performerName: 'Pop Icons', eventDate: '2025-09-22', eventTime: '18:30', section: 'C', row: '2', price: 60 },
  { id: 4, eventName: 'Classical Evening', performerName: 'Symphony Orchestra', eventDate: '2025-09-23', eventTime: '19:30', section: 'A', row: '4', price: 70 },
  { id: 5, eventName: 'Hip Hop Blast', performerName: 'Urban Beats', eventDate: '2025-09-24', eventTime: '21:00', section: 'D', row: '5', price: 55 },
  { id: 6, eventName: 'Indie Vibes', performerName: 'Indie Stars', eventDate: '2025-09-25', eventTime: '19:00', section: 'C', row: '6', price: 45 },
  { id: 7, eventName: 'Electronic Dreams', performerName: 'DJ Pulse', eventDate: '2025-09-26', eventTime: '22:00', section: 'B', row: '7', price: 65 },
  { id: 8, eventName: 'Folk Night', performerName: 'The Folksters', eventDate: '2025-09-27', eventTime: '18:00', section: 'A', row: '8', price: 35 },
  { id: 9, eventName: 'Blues Evening', performerName: 'Blue Notes', eventDate: '2025-09-28', eventTime: '20:00', section: 'C', row: '9', price: 50 },
  { id: 10, eventName: 'Metal Mayhem', performerName: 'Metal Heads', eventDate: '2025-09-29', eventTime: '21:30', section: 'D', row: '10', price: 60 },
  { id: 11, eventName: 'Reggae Vibes', performerName: 'Reggae Kings', eventDate: '2025-09-30', eventTime: '19:00', section: 'B', row: '11', price: 45 },
  { id: 12, eventName: 'Country Roads', performerName: 'Country Stars', eventDate: '2025-10-01', eventTime: '18:30', section: 'A', row: '12', price: 40 },
  { id: 13, eventName: 'Soul Night', performerName: 'Soulful Singers', eventDate: '2025-10-02', eventTime: '20:00', section: 'C', row: '13', price: 55 },
  { id: 14, eventName: 'Acoustic Vibes', performerName: 'Guitar Heroes', eventDate: '2025-10-03', eventTime: '19:00', section: 'B', row: '14', price: 50 },
  { id: 15, eventName: 'EDM Party', performerName: 'DJ Spark', eventDate: '2025-10-04', eventTime: '22:00', section: 'D', row: '15', price: 70 },
  { id: 16, eventName: 'Latin Fiesta', performerName: 'Salsa Stars', eventDate: '2025-10-05', eventTime: '20:30', section: 'A', row: '16', price: 60 },
  { id: 17, eventName: 'K-Pop Night', performerName: 'K-Pop Band', eventDate: '2025-10-06', eventTime: '19:00', section: 'C', row: '17', price: 80 },
  { id: 18, eventName: 'Opera Gala', performerName: 'Opera Divas', eventDate: '2025-10-07', eventTime: '18:00', section: 'B', row: '18', price: 90 },
  { id: 19, eventName: 'Punk Rock', performerName: 'The Rebels', eventDate: '2025-10-08', eventTime: '21:00', section: 'D', row: '19', price: 55 },
  { id: 20, eventName: 'Indie Pop', performerName: 'The Indietones', eventDate: '2025-10-09', eventTime: '20:00', section: 'A', row: '20', price: 50 },
];

export function getEventsStore(): Event[] {
  const stringifiedEvents = localStorage.getItem('events-store');
  return stringifiedEvents ? JSON.parse(stringifiedEvents) : INITIAL_EVENTS_STORE;
}

export function setEventsStore(events: Event[]) {
  return localStorage.setItem('events-store', JSON.stringify(events));
}

export async function getManyEvents({
  paginationModel,
  sortModel,
  filterModel,
}: {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
}): Promise<{ items: Event[]; itemCount: number }> {
  const eventsStore = getEventsStore();

  let filteredEvents = [...eventsStore];

  if (filterModel?.items?.length) {
    filterModel.items.forEach(({ field, value, operator }) => {
      if (!field || value == null) return;

      filteredEvents = filteredEvents.filter((event) => {
        const eventValue = event[field as keyof Event];

        switch (operator) {
          case 'contains':
            return String(eventValue).toLowerCase().includes(String(value).toLowerCase());
          case 'equals':
            return eventValue === value;
          case 'startsWith':
            return String(eventValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'endsWith':
            return String(eventValue).toLowerCase().endsWith(String(value).toLowerCase());
          case '>':
            return eventValue > value;
          case '<':
            return eventValue < value;
          default:
            return true;
        }
      });
    });
  }

  if (sortModel?.length) {
    filteredEvents.sort((a, b) => {
      for (const { field, sort } of sortModel) {
        if (a[field as keyof Event] < b[field as keyof Event]) return sort === 'asc' ? -1 : 1;
        if (a[field as keyof Event] > b[field as keyof Event]) return sort === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const start = paginationModel.page * paginationModel.pageSize;
  const end = start + paginationModel.pageSize;
  const paginatedEvents = filteredEvents.slice(start, end);

  return {
    items: paginatedEvents,
    itemCount: filteredEvents.length,
  };
}
