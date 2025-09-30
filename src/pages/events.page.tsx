import * as React from "react";
import { useSelector } from "react-redux";
import { Box, Alert, Button, CircularProgress } from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

import DataGridPage from "../components/common/datagrid.comon";
import type { RootState } from "../store";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { getEvents } from "../store/slices/events.slice"; // generalized slice

export default function EventsPage() {
  const dispatch = useAppDispatch();

  const {
    rows: { data, total },
    loading,
    error,
  } = useSelector((state: RootState) => state.events);
  const {
    rows: listingsMetaRows,
    loading: listingsMetaLoading,
    error: listingsMetaError,
  } = useSelector((state: RootState) => state.listingsMeta);

  const [selectedEvent, setSelectedEvent] = React.useState<any | null>(null);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 10,
    });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  const sortField = sortModel[0]?.field || undefined;
  const sortOrder = sortModel[0]?.sort || undefined;
  const filters = filterModel?.items?.length ? filterModel : undefined;

  // Fetch events
  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortField,
        sortOrder,
        filters,
      })
    );
  }, [dispatch, paginationModel, sortField, sortOrder, filters]);

  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortField,
        sortOrder,
        filters,
      })
    );
  }, [dispatch, paginationModel, sortField, sortOrder, filters]);

  const handleRefresh = () => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortField,
        sortOrder,
        filters,
      })
    );
  };

  const handleRowClick = (event: any) => {
    setSelectedEvent(event.row);
    // dispatch analytics here if needed
  };

  // Chart support
  const ranges = ["1m", "2m", "5m", "10m"];
  const chartData =
    selectedEvent?.listings?.map((l: any) => ({
      time: new Date(l.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      tickets: l.ticketCount,
      min: l.priceMin,
      max: l.priceMax,
      median: l.priceMedian,
      createdAt: l.createdAt,
    })) || [];

  const filterByRange = (range: string) => {
    const now = new Date().getTime();
    const cutoffMinutes = parseInt(range.replace("m", ""), 10);
    return chartData.filter(
      (d: any) =>
        new Date(d.createdAt).getTime() >= now - cutoffMinutes * 60 * 1000
    );
  };

  // Columns for DataGrid
  const columns: GridColDef[] = [
    { field: "eventId", headerName: "Event ID" },
    { field: "name", headerName: "Event Name", flex: 1 },
    {
      field: "localDate",
      headerName: "Local Date & Time",
      type: "dateTime",
      valueFormatter: (params) => {
        if (!params) return "";
        const date = new Date(params);
        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      },
      flex: 1,
    },
    { field: "exclusiveListingCount", headerName: "Exclusive Listings" },
    { field: "listingCount", headerName: "Listings" },
    { field: "ticketCount", headerName: "Tickets" },
    { field: "category", headerName: "Category" },
    { field: "maxPrice", headerName: "Max Price" },
    { field: "minPrice", headerName: "Min Price" },
    {
      field: "actions",
      type: "actions",
      width: 100,
      getActions: (params) => [
        <Button
          key={params.row.eventId}
          variant="contained"
          color="info"
          size="small"
          onClick={() => handleRowClick(params)}
        >
          View
        </Button>,
      ],
    },
  ];

  return (
    <Box>
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {selectedEvent && (
            <Box mb={3}>
              <h3>{selectedEvent.name} – Analytics</h3>
              {/* Charts per range */}
              {ranges.map((r) => {
                const rangeData = filterByRange(r);
                return (
                  <Box key={r} mb={4}>
                    <h4>{r} Range</h4>
                    <LineChart
                      height={300}
                      series={[
                        {
                          data: rangeData.map((d: any) => d.min),
                          label: "Min",
                        },
                        {
                          data: rangeData.map((d: any) => d.median),
                          label: "Median",
                        },
                        {
                          data: rangeData.map((d: any) => d.max),
                          label: "Max",
                        },
                      ]}
                      xAxis={[
                        {
                          scaleType: "point",
                          data: rangeData.map((d: any) => d.time),
                        },
                      ]}
                    />
                    <BarChart
                      height={200}
                      series={[
                        {
                          data: rangeData.map((d: any) => d.tickets),
                          label: "Tickets",
                        },
                      ]}
                      xAxis={[
                        {
                          scaleType: "point",
                          data: rangeData.map((d: any) => d.time),
                        },
                      ]}
                    />
                  </Box>
                );
              })}
            </Box>
          )}

          <DataGridPage
            title={"Events"}
            rows={data}
            rowCount={total}
            onRefresh={handleRefresh}
            isLoading={loading}
            error={error as any}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            columns={columns}
            sortingModel={sortModel}
            setSortingModel={setSortModel}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            showToolbar
          />
        </>
      )}
    </Box>
  );
}
