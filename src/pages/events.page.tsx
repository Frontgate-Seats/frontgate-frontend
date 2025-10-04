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
import {
  ChartContainer,
  ChartsGrid,
  ChartsTooltip,
  ChartsXAxis,
  ChartsYAxis,
  LinePlot,
  BarPlot,
  MarkPlot,
  type BarSeriesType,
  type LineSeriesType,
} from "@mui/x-charts";
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
import moment from "moment";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { rows: { data: events, total }, loading: eventsLoading, error: eventsError } = 
    useSelector((state: RootState) => state.events);
  const { rows: { data: listingsMeta }, loading: listingsMetaLoading } = 
    useSelector((state: RootState) => state.listingsMeta);

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "utcDate", sort: "asc" }]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [{ field: "utcDate", operator: "onOrAfter", value: moment().utc().toISOString() }],
  });
  const [selectedEvent, setSelectedEvent] = React.useState<any | null>(null);

  React.useEffect(() => {
    dispatch(getEvents({ page: paginationModel.page, pageSize: paginationModel.pageSize, sortFields: sortModel, filters: filterModel }));
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(getEvents({ page: paginationModel.page, pageSize: paginationModel.pageSize, sortFields: sortModel, filters: filterModel }));
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRowClick = (row: any) => {
    setSelectedEvent(row);
    dispatch(getListingsMeta({ filters: { items: [{ field: "eventId", operator: "equals", value: row.eventId }] }, page: 0, pageSize: 1000 }));
  };

  const columns: GridColDef[] = [
    { field: "eventId", headerName: "Event ID", flex: 1 },
    { field: "name", headerName: "Event Name", flex: 1 },
    { field: "utcDate", headerName: "Date & Time", type: "dateTime", flex: 1,
      valueFormatter: (value) => value ? moment(value).format("DD/MM/YYYY hh:mm A") : "-" },
    { field: "venueDBId", headerName: "Venue", flex: 1,
      valueGetter: (value: any) => value ? `${value.city}, ${value.stateCode} (${value.countryCode})` : "-" },
    { field: "category", headerName: "Category", flex: 1 },
    { field: "ticketCount", headerName: "Ticket Count", flex: 1 },
    { field: "listingCount", headerName: "Listing Count", flex: 1 },
    { field: "actions", type: "actions", flex: 1, width: 120,
      getActions: (params) => [<Button key={params.row.eventId} onClick={() => navigate(`/events/${params.row.eventId}/listings`)} variant="contained" size="small">View</Button>] },
  ];

  const dataset = listingsMeta.map((item) => ({
    time: moment(item.createdAt).format("MM/DD hh:mm A"),
    tickets: item.ticketCount ?? 0,
    priceMin: item.priceMin ?? 0,
    twoPlusPriceMin: item.twoPlusPriceMin ?? 0,
    getInPriceMin: item.getInPriceMin ?? 0,
  }));

  const leftMax = React.useMemo(() => Math.ceil(Math.max(...dataset.map(d => Math.max(d.priceMin, d.twoPlusPriceMin, d.getInPriceMin))) * 1.1) || 100, [dataset]);
  const rightMax = React.useMemo(() => Math.max(10, Math.ceil(Math.max(...dataset.map(d => d.tickets)) * 1.1)) || 10, [dataset]);

  const lineSeries: LineSeriesType[] = [
    { type: "line", dataKey: "priceMin", color: "#1976d2", yAxisId: "leftAxis" },
    { type: "line", dataKey: "twoPlusPriceMin", color: "#ff7043", yAxisId: "leftAxis" },
    { type: "line", dataKey: "getInPriceMin", color: "#26a69a", yAxisId: "leftAxis" },
  ];

  const barSeries: BarSeriesType[] = [
    { type: "bar", dataKey: "tickets", color: "rgba(144,164,174,0.45)", yAxisId: "rightAxis" },
  ];

  return (
    <Grid container spacing={2}>
      <Grid size={{xs:12}}>
        {selectedEvent && (
          <Box>
            {/* Event Info */}
            <Card variant="outlined" sx={{ mb: 3, boxShadow: 1 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>{selectedEvent.name}</Typography>
                <Stack spacing={1} divider={<Divider flexItem />}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(selectedEvent.localDate).toLocaleString()} | {selectedEvent.venueDBId?.city}, {selectedEvent.venueDBId?.stateCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {selectedEvent.category}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Combo Chart */}
            {dataset.length > 0 && (
              <Card sx={{ boxShadow: 1 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Event Trends
                  </Typography>
                  <ChartContainer
                    dataset={dataset}
                    series={[...lineSeries, ...barSeries]}
                    xAxis={[{ dataKey: "time", scaleType: "band", label: "Date & Time" }]}
                    yAxis={[
                      { id: "leftAxis", label: "Price ($)", min: 0, max: leftMax },
                      { id: "rightAxis", label: "Tickets Qty", position: "right", min: 0, max: rightMax },
                    ]}
                    height={400}
                  >
                    <ChartsGrid horizontal />
                    <BarPlot />
                    <LinePlot />
                    <MarkPlot  color="#ff5252"  />
                    <ChartsXAxis />
                    <ChartsYAxis axisId="leftAxis" />
                    <ChartsYAxis axisId="rightAxis" />
                    <ChartsTooltip  />
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        <Grid size={{xs:12}}>
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
              onRowClick={(value) => handleRowClick(value.row)}
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
