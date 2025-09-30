import * as React from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Alert,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
} from "@mui/material";
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
  const [selectedEvent, setSelectedEvent] = React.useState<any | null>(null);

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
    { field: "name", headerName: "Event Name", flex: 1 },
    {
      field: "localDate",
      headerName: "Date & Time",
      type: "dateTime",
      flex: 1,
      valueFormatter: (params) => {
        if (!params) return "-";
        return new Date(params).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      field: "venueDBId",
      headerName: "Venue",
      flex: 1,
      valueGetter: (params: any) =>
        params
          ? `${params.city}, ${params.stateCode} (${params.countryCode})`
          : "-",
    },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "ticketCount", headerName: "Ticket Count", flex: 1 },
    { field: "listingCount", headerName: "Listing Count", flex: 1 },
    {
      field: "actions",
      type: "actions",
      flex: 1,
      width: 120,
      getActions: (params) => [
        <Button
          key={params.row.eventId}
          onClick={() => navigate(`/events/${params.row.eventId}/listings`)}
          variant="contained"
          size="small"
        >
          View
        </Button>,
      ],
    },
  ];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        {selectedEvent ? (
          <Box>
            {/* Event Info Card */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.name}
                </Typography>
                <Stack spacing={1} divider={<Divider flexItem />}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedEvent.localDate).toLocaleString()} |{" "}
                    {selectedEvent.venueDBId?.city},{" "}
                    {selectedEvent.venueDBId?.stateCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {selectedEvent.category}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trends
                </Typography>
                {listingsMeta.length === 0 ? (
                  <Box
                    sx={{
                      height: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                    }}
                  >
                    No data available
                  </Box>
                ) : (
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
                      },
                    ]}
                    yAxis={[
                      {
                        id: "price",
                        label: "Price ($)",
                        scaleType: "linear",
                        min:0,
                      },
                      {
                        id: "tickets",
                        label: "Tickets Qty",
                        position: "right",
                        scaleType: "linear",
                        min: 0
                      },
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
                        label: "Get-In Price Min",
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
                          "& .MuiChartsLegend-itemMark": {
                            width: 14,
                            height: 14,
                          },
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
                      background:
                        "linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)",
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
                      "& .MuiChartsAxis-tickLabel": {
                        fill: "#616161",
                        fontSize: 12,
                      },
                      "& .MuiLineSeries-root": { strokeWidth: 2.5 },
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Box>
        ) : (
          <></>
        )}

        <Grid size={{ xs: 12 }}>
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
        </Grid>
      </Grid>
    </Grid>
  );
}
