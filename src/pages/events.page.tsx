import * as React from "react";
import { useSelector } from "react-redux";
import { Box, Alert, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { LineChart } from "@mui/x-charts";
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
    React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });
  const [selectedEvent, setSelectedEvent] = React.useState<string | null>(null);

  const sortField = sortModel[0]?.field ?? undefined;
  const sortOrder = sortModel[0]?.sort ?? undefined;
  const filters = filterModel?.items?.length ? filterModel : undefined;

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

  const handleRowClick = (row: any) => {
    setSelectedEvent(row);
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
      flex: 1,
      valueGetter: (params: any) =>
        params
          ? `${params.addressLine}, ${params.city}, ${params.stateCode} ${params.postalCode}, ${params.countryCode}`
          : "-",
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

  return (
    <Box>
      {/* ListingsMeta Chart */}
      {selectedEvent && (
        <Box sx={{ mb: 3, position: "relative" }}>
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

          <Box sx={{ position: "relative", height: 450, mb: 3 }}>
            {/* Title inside chart */}
            <Typography
              variant="h6"
              sx={{
                position: "absolute",
                top: 16, // distance from top of chart
                left: "50%",
                transform: "translateX(-50%)",
                fontWeight: 600,
                color: "#424242",
                zIndex: 10,
                pointerEvents: "none", // ensures chart interactions still work
              }}
            >
              Trands
            </Typography>

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
                { dataKey: "time", scaleType: "time", label: "Date & Time" },
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
                  color: "#90a4ae",
                  curve: "monotoneX",
                },
                {
                  dataKey: "medianPrice",
                  label: "Median Price",
                  yAxisId: "price",
                  color: "#1976d2",
                  curve: "monotoneX",
                  valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                },
                {
                  dataKey: "priceMin",
                  label: "Min Price",
                  yAxisId: "price",
                  color: "#9c27b0",
                  curve: "monotoneX",
                  valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                },
                {
                  dataKey: "twoPlusPriceMin",
                  label: "Price Min 2+",
                  yAxisId: "price",
                  color: "#ff7043",
                  curve: "monotoneX",
                  valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                },
                {
                  dataKey: "getInPriceMin",
                  label: "Get-In Price Min 2+",
                  yAxisId: "price",
                  color: "#26a69a",
                  curve: "monotoneX",
                  valueFormatter: (v) => (v != null ? `$${v}` : "-"),
                },
              ]}
              height={400}
              slotProps={{
                legend: {
                  position: { vertical: "bottom", horizontal: "center" },
                  direction: "horizontal",
                  sx: {
                    "& .MuiChartsLegend-itemMark": { width: 14, height: 14 },
                    "& .MuiChartsLegend-label": {
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#424242",
                    },
                  },
                },
                tooltip: {
                  sx: {
                    backgroundColor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    "& .MuiChartsTooltip-title": {
                      fontWeight: 600,
                      color: "#212121",
                    },
                    "& .MuiChartsTooltip-value": {
                      fontWeight: 500,
                      color: "#1976d2",
                    },
                  },
                },
              }}
              sx={{
                background: "linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)",
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                p: 3,
                "& .MuiChartsGrid-line": {
                  stroke: "#bdbdbd",
                  strokeDasharray: "0",
                },
                "& .MuiChartsAxis-root .MuiChartsAxis-line": {
                  stroke: "#9e9e9e",
                },
                "& .MuiChartsAxis-tickLabel": { fill: "#616161", fontSize: 12 },
                "& .MuiLineSeries-root": { strokeWidth: 2.5 },
              }}
            />
          </Box>
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
