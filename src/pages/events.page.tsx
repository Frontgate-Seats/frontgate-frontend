import * as React from "react";
import { useSelector } from "react-redux";
import { Box, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";

import DataGridPage from "../components/common/datagrid.comon";
import type { RootState } from "../store";
import { getEvents } from "../store/slices/events.slice";
import { getListingsMeta } from "../store/slices/listingsMeta.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { ChartsTooltip, LineChart } from "@mui/x-charts";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    rows: { data: events, total },
    loading: eventsLoading,
    error: eventsError,
  } = useSelector((state: RootState) => state.events);

  const {
    rows: { data: listingsMeta },
    loading: listingsMetaLoading,
  } = useSelector((state: RootState) => state.listingsMeta);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 10,
    });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null
  );

  const sortField = sortModel[0]?.field ?? undefined;
  const sortOrder = sortModel[0]?.sort ?? undefined;
  const filters = filterModel?.items?.length ? filterModel : undefined;

  // Fetch events whenever pagination, sort, filter changes
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

  // Row click: fetch listingsMeta
  const handleRowClick = (row: any) => {
    setSelectedEventId(row.eventId);
    dispatch(
      getListingsMeta({
        filters: {
          items: [{ field: "eventId", operator: "equals", value: row.eventId }],
        },
        page: 0,
        pageSize: 1000,
      })
    );
  };

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
    {
      field: "venueDBId",
      headerName: "Venue Location",
      type: "string",
      valueGetter: (params: any) => {
        if (!params) return "-";
        return `${params.addressLine}, ${params.city}, ${params.stateCode} ${params.postalCode}, ${params.countryCode}`;
      },
      flex: 1,
    },
    { field: "category", headerName: "Category" },
    {
      field: "actions",
      type: "actions",
      width: 100,
      getActions: (params) => [
        <button
          key={params.row.eventId}
          onClick={() => navigate(`/events/${params.row.eventId}/listings`)}
        >
          View
        </button>,
      ],
    },
  ];

  console.log("listingsMeta : ", listingsMeta);
  // Prepare chart data

  return (
    <Box>
      {/* ListingsMeta Chart */}

      {selectedEventId && (
        <Box sx={{ height: 400, mb: 2, position: "relative" }}>
          {listingsMeta.length === 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#f5f5f5",
                color: "#999",
                fontSize: "1.2rem",
                fontWeight: 500,
                zIndex: 1,
              }}
            >
              No data available
            </Box>
          )}

          <LineChart
            dataset={listingsMeta.map((item) => ({
              time: new Date(item.createdAt),
              tickets: item.ticketCount,
              medianPrice: item.priceMedian,
              priceMin: item.priceMin,
              twoPlusPriceMin: item.twoPlusPriceMin,
              getInPriceMin: item.getInPriceMin,
            }))}
            xAxis={[
              {
                dataKey: "time",
                scaleType: "time",
                label: "Date & Time",
                valueFormatter: (v: Date) =>
                  v.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }),
              },
            ]}
            yAxis={[
              { id: "price", label: "Price ($)" },
              { id: "tickets", label: "Tickets Qty", position: "right" },
            ]}
            series={[
              {
                dataKey: "tickets",
                label: "Tickets Qty",
                yAxisId: "tickets",
                color: "#757575",
                valueFormatter: (v) => (v != null ? `${v}` : "-"),
              },
              {
                dataKey: "medianPrice",
                label: "Median Price",
                yAxisId: "price",
                color: "#1976d2",
                valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                curve: "monotoneX", // smooth line
              },
              {
                dataKey: "priceMin",
                label: "Min Price",
                yAxisId: "price",
                color: "#9c27b0",
                valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                curve: "monotoneX",
              },
              {
                dataKey: "twoPlusPriceMin",
                label: "Price Min 2+",
                yAxisId: "price",
                color: "#ff5722",
                valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                curve: "monotoneX",
              },
              {
                dataKey: "getInPriceMin",
                label: "Get-In Price Min 2+",
                yAxisId: "price",
                color: "#009688",
                valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                curve: "monotoneX",
              },
            ]}
            height={450}
            slotProps={{
              legend: {
                position: { vertical: "bottom", horizontal: "center" },
              },
              tooltip: {
                sx: {
                  padding: 10,
                  backgroundColor: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  typography: "body2",
                },
              },
            }}
            sx={{
              "& .MuiLineChart-root": {
                backgroundColor: "#fafafa",
                borderRadius: 2,
                p: 2,
              },
              "& .MuiChartsLegend-root": {
                fontWeight: 600,
              },
              "& .MuiLineSeries-root": {
                strokeWidth: 3, // apply stroke width globally for lines
              },
            }}
          />
        </Box>
      )}

      {eventsError ? (
        <Alert severity="error">{eventsError}</Alert>
      ) : (
        <DataGridPage
          title="Events"
          rows={events}
          rowCount={total}
          columns={columns}
          isLoading={eventsLoading || listingsMetaLoading}
          error={eventsError as any}
          paginationModel={paginationModel}
          setPaginationModel={setPaginationModel}
          sortingModel={sortModel}
          setSortingModel={setSortModel}
          filterModel={filterModel}
          setFilterModel={setFilterModel}
          showToolbar
          autoHeight
          paginationMode="server"
          sortingMode="server"
          filterMode="server"
          onRowClick={(params) => handleRowClick(params.row)}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  );
}
