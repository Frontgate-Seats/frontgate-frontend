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
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "utcDate", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [
      { field: "category", operator: "equals", value: "Sports" },
      {
        field: "utcDate",
        operator: "onOrAfter",
        value: moment().utc().toISOString(),
      },
    ],
  });
  const [selectedEvent, setSelectedEvent] = React.useState<any | null>(null);

  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

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
    { field: "eventId", headerName: "Event ID", flex: 0.8, minWidth: 120 },
    { field: "name", headerName: "Event Name", flex: 2, minWidth: 200 },
    {
      field: "utcDate",
      headerName: "Date & Time (UTC)",
      type: "dateTime",
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (value) =>
        value ? moment(value).format("DD/MM/YYYY hh:mm A") : "-",
    },
    {
      field: "venueDBId",
      headerName: "Venue",
      flex: 2,
      minWidth: 220,
      valueGetter: (value: any) =>
        value
          ? `${value.city}, ${value.stateCode} (${value.countryCode})`
          : "-",
      filterable: false,
      sortable: false,
    },
    { field: "category", headerName: "Category", flex: 1, minWidth: 140 },
    {
      field: "ticketCount",
      headerName: "Ticket Count",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "listingCount",
      headerName: "Listing Count",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 0,
      width: 120, 
      getActions: (params) => [
        <Button
          key={params.row.eventId}
          onClick={(e) => {
            e.stopPropagation();
            const url = `/listings/${params.row.eventId}`;
            if (e.ctrlKey || e.metaKey) {
              window.open(url, "_blank");
            } else {
              navigate(url);
            }
          }}
          variant="contained"
          size="small"
          sx={{ borderRadius: 2 }}
        >
          View
        </Button>,
      ],
    },
  ];

  const dataset = listingsMeta.map((item) => ({
    time: moment(item.createdAt).format("MM/DD hh:mm A"),
    tickets: item.ticketCount ?? 0,
    priceMin: item.priceMin ?? 0,
    twoPlusPriceMin: item.twoPlusPriceMin ?? 0,
    getInPriceMin: item.getInPriceMin ?? 0,
  }));

  const leftMax = React.useMemo(
    () =>
      Math.ceil(
        Math.max(
          ...dataset.map((d) =>
            Math.max(d.priceMin, d.twoPlusPriceMin, d.getInPriceMin)
          )
        ) * 1.1
      ) || 100,
    [dataset]
  );
  const rightMax = React.useMemo(
    () =>
      Math.max(
        10,
        Math.ceil(Math.max(...dataset.map((d) => d.tickets)) * 1.1)
      ) || 10,
    [dataset]
  );

  const lineSeries: LineSeriesType[] = [
    {
      type: "line",
      label: "Min Price",
      dataKey: "priceMin",
      color: "#1976d2",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      curve: "monotoneX",
    },
    {
      type: "line",
      label: "Min Price 2+",
      dataKey: "twoPlusPriceMin",
      color: "#ff7043",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      curve: "monotoneX",
    },
    {
      type: "line",
      label: "GetIn Price Min 2+",
      dataKey: "getInPriceMin",
      color: "#26a69a",
      yAxisId: "leftAxis",
      valueFormatter: (v) => (v != null ? `$${v}` : "-"),
      curve: "monotoneX",
    },
  ];

  const barSeries: BarSeriesType[] = [
    {
      type: "bar",
      label: "Tickets",
      dataKey: "tickets",
      color: "rgba(144,164,174,0.45)",
      yAxisId: "rightAxis",
      valueFormatter: (v) => (v != null ? `${v}` : "-"),
    },
  ];

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        {selectedEvent && (
          <Box>
            {/* Event Info */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  {selectedEvent.name}
                </Typography>
                <Stack spacing={1} divider={<Divider flexItem />}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEvent.localDate
                      ? moment(selectedEvent.localDate).format(
                          "DD/MM/YYYY hh:mm A"
                        )
                      : "-"}{" "}
                    {selectedEvent.venueDBId?.city},{" "}
                    {selectedEvent.venueDBId?.stateCode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {selectedEvent.category}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Combo Chart */}
            <Card>
              <CardContent sx={{ position: "relative" }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Trends
                </Typography>
                <ChartContainer
                  dataset={dataset || []} // fallback to empty array
                  series={[...lineSeries, ...barSeries]}
                  xAxis={[
                    {
                      dataKey: "time",
                      scaleType: "band",
                      label: "Date & Time",
                    },
                  ]}
                  yAxis={[
                    {
                      id: "leftAxis",
                      label: "Price ($)",
                      min: 0,
                      max: leftMax,
                    },
                    {
                      id: "rightAxis",
                      label: "Tickets Qty",
                      position: "right",
                      min: 0,
                      max: rightMax,
                    },
                  ]}
                  height={400}
                >
                  <ChartsGrid horizontal />
                  <BarPlot />
                  <LinePlot />
                  <MarkPlot />
                  <ChartsXAxis />
                  <ChartsYAxis axisId="leftAxis" />
                  <ChartsYAxis axisId="rightAxis" />
                  <ChartsTooltip />
                </ChartContainer>

                {/* Optional: show a message if no data */}
                {dataset.length === 0 && (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    align="center"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    No data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
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
