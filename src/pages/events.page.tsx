import * as React from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Link,
} from "@mui/material";
import { BarChart } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";

import moment from "moment";

import type { RootState } from "../store";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { getEvents } from "../store/slices/events.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { getSales } from "../store/slices/sales.slice";
import { getEventsExternalMappings } from "../store/slices/eventsExternalMappings.slice";
import { useClientFilters } from "../hooks/useClientFilters";
import {
  getDefaultInterval,
  INTERVAL_OPTIONS_MAP,
  SALES_TRENDS_CHART_CONFIG,
  TIME_RANGE_OPTIONS,
} from "../shared/constants/components.constants";
import DynamicChart from "../components/common/charts/DynamicChart";
import { useSalesChartData } from "../hooks/useChartData";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const chartRef = React.useRef<HTMLDivElement>(null);

  // ------------------------
  // Redux Data
  // ------------------------
  const {
    rows: { data: events, total },
    loading: eventsLoading,
    error: eventsError,
  } = useSelector((state: RootState) => state.events);

  const {
    rows: { data: sales },
    loading: salesLoading,
    error: salesErr,
  } = useSelector((state: RootState) => state.sales);
  const {
    rows: { data: eventsExternalMappings },
  } = useSelector((state: RootState) => state.eventsExternalMappings);

  // ------------------------
  // Grid State
  // ------------------------
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "local_date", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [
      {
        field: "local_date",
        operator: "onOrAfter",
        value: moment().toISOString(),
      },
      {
        field: "local_date",
        operator: "onOrBefore",
        value: moment().add(6, "months").toISOString(),
      },
    ],
  });

  // ------------------------
  // Sales Chart State
  // ------------------------
  const [timeSalesGraph, setTimeSalesGraph] = React.useState("1d");
  const [intervalSalesGraph, setIntervalSalesGraph] = React.useState("1h");

  React.useEffect(() => {
    setIntervalSalesGraph(getDefaultInterval(timeSalesGraph));
  }, [timeSalesGraph]);

  const datasetSalesGraph = useSalesChartData(
    sales || [],
    timeSalesGraph,
    intervalSalesGraph,
  );

  // ------------------------
  // Selected Event State
  // ------------------------
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

  // ------------------------
  // Sales Data Grid Columns
  // ------------------------
  const salesColumns: CustomGridColDef[] = [
    {
      field: "purchased_at",
      headerName: "Date & Time",
      minWidth: 120,
      flex: 1,
      type: "dateTime",
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "section_name",
      headerName: "Section",
      flex: 1,
      minWidth: 100,
      type: "string",
    },
    {
      field: "row_name",
      headerName: "Row",
      flex: 1,
      minWidth: 100,
      type: "string",
    },
    {
      field: "base_price",
      headerName: "Price",
      minWidth: 120,
      min: 0,
      flex: 1,
      max: 20000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? `${value.toFixed(2)}` : "-",
    },
    {
      field: "quantity",
      headerName: "Quantity",
      minWidth: 80,
      flex: 1,
      min: 0,
      max: 1000,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" && value >= 0 ? value.toString() : "-",
    },
  ];

  // ------------------------
  // Sales Grid State
  // ------------------------
  const {
    paginationModel: salesPaginationModel,
    sortModel: salesSortModel,
    filterModel: salesFilterModel,
    setPaginationModel: setSalesPaginationModel,
    setSortModel: setSalesSortModel,
    setFilterModel: setSalesFilterModel,
    paginatedRows: paginatedSales,
    totalFilteredRows: salesTotalFiltered,
  } = useClientFilters({
    data: sales || [],
    columns: salesColumns,
    initialPaginationModel: { page: 0, pageSize: 25 },
    initialSortModel: [{ field: "purchased_at", sort: "desc" }],
    initialFilterModel: { items: [] },
  });

  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handlefetchSales = React.useCallback(async () => {
    const external_event_id =
      eventsExternalMappings?.[0]?.external_event_id?.toString();

    if (!external_event_id) return;

    await dispatch(getSales(external_event_id));
  }, [dispatch, eventsExternalMappings]);

  const handlefetchEventsExternalMappings = React.useCallback(
    async (event_id: string) => {
      const externalEventMappingsFilters = {
        items: [
          {
            field: "event_id",
            operator: "equals",
            value: event_id,
          },
        ],
      };

      await dispatch(
        getEventsExternalMappings({
          filters: externalEventMappingsFilters,
        }),
      );
    },
    [dispatch],
  );

  const handleRowClick = async (row: any) => {
    if (row.id === selectedEvent?.id) return;
    await handlefetchEventsExternalMappings(row.id);
    setSelectedEvent(row);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };

  // ------------------------
  // Auto-fetch sales data for selected event
  // ------------------------
  React.useEffect(() => {
    if (!eventsExternalMappings?.length) return;

    const external_event_id =
      eventsExternalMappings?.[0]?.external_event_id?.toString();

    if (!external_event_id) return;

    handlefetchSales();

    const intervalId = setInterval(() => handlefetchSales(), 600000);

    return () => clearInterval(intervalId);
  }, [eventsExternalMappings, handlefetchSales]);

  // ------------------------
  // Data Grid Columns
  // ------------------------
  const columns: CustomGridColDef[] = [
    {
      field: "view",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title="View listings Meta Data">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(params.row);
            }}
            color="primary"
            size="small"
          >
            <BarChart />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "id",
      headerName: "Event ID",
      minWidth: 120,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderCell: (params) => {
        const event = events.find((e) => e.id == params.value);
        let url;
        switch (event.platform) {
          case "vividseats":
            url = `https://www.vividseats.com${event.web_path}`;
            break;
          default:
            break;
        }
        return (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary"
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: "name",
      headerName: "Event Name",
      flex: 1,
      type: "string",
    },
    {
      field: "local_date",
      headerName: "Event Date & Time",
      type: "dateTime",
      width: 160,
      valueFormatter: (value) =>
        value ? formatDateTime(moment.parseZone(value)) : "-",
      renderEditCell: (params) => (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DateTimePicker
            value={params.value ? moment(params.value) : moment()}
            onChange={(value) =>
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: value,
              })
            }
            minDateTime={moment()} // prevent past selection
          />
        </LocalizationProvider>
      ),
    },
    // TODO AGGIGATE VENUE
    {
      field: "venue_name",
      headerName: "Venue",
      flex: 0.5,
      minWidth: 120,
    },
    {
      field: "venue_city",
      headerName: "City",
      minWidth: 100,
    },
    {
      field: "venue_state",
      headerName: "State",
      minWidth: 100,
    },
    {
      field: "category_name",
      headerName: "Category",
      minWidth: 100,
      type: "singleSelect",
      valueOptions: ["Sports", "Concerts"],
    },
    {
      field: "ticket_count",
      headerName: "Tickets",
      minWidth: 100,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "listing_count",
      headerName: "Listings",
      minWidth: 100,
      type: "number",
      min: 0,
      max: 20000,
    },
    {
      field: "getInPriceMedian",
      headerName: "Median Price",
      minWidth: 10,
      type: "number",
      min: 0,
      max: 20000,
      valueFormatter: (value) => (value >= 0 ? `${value}` : "-"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      minWidth: 120,
      getActions: (params) => [
        <Button
          key="listings"
          onClick={() => window.open(`/functions/v1/events-api/ui/listings/${params.row.id}`, "_blank")}
          variant="contained"
          size="small"
        >
          View Listings
        </Button>,
      ],
    },
  ];

  // ------------------------
  // Render
  // ------------------------
  return (
    <Stack
      padding={3}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Grid container spacing={3}>
        {selectedEvent && (
          <>
            {/* EVENT DETAILS */}
            <Grid size={{ xs: 12 }} ref={chartRef}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedEvent?.name}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.local_date
                          ? formatDateTime(
                              moment.parseZone(selectedEvent.local_date),
                            )
                          : ""}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Venue
                      </Typography>
                      <Typography variant="body1">
                        {`${selectedEvent?.venue_name}, ${selectedEvent?.venue_city}, ${selectedEvent?.venue_state}`}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Performer
                      </Typography>
                      <Typography variant="body1">
                        {selectedEvent?.primary_performer_name}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Sales Trends */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DynamicChart
                title="Sales Trends"
                dataset={datasetSalesGraph}
                chartConfig={SALES_TRENDS_CHART_CONFIG}
                loading={salesLoading}
                timeRange={timeSalesGraph}
                interval={intervalSalesGraph}
                onTimeRangeChange={setTimeSalesGraph}
                onIntervalChange={setIntervalSalesGraph}
                timeRangeOptions={TIME_RANGE_OPTIONS}
                intervalOptionsMap={INTERVAL_OPTIONS_MAP}
                height={400}
              />
            </Grid>

            {/* SALES DATA GRID */}
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomDataGrid
                title="Sales Data"
                rows={paginatedSales}
                rowCount={salesTotalFiltered}
                columns={salesColumns}
                isLoading={salesLoading}
                error={salesErr}
                paginationModel={salesPaginationModel}
                setPaginationModel={setSalesPaginationModel}
                sortingModel={salesSortModel}
                setSortingModel={setSalesSortModel}
                filterModel={salesFilterModel}
                setFilterModel={setSalesFilterModel}
                defaultFilterType="header"
                onRefresh={() => {
                  handlefetchSales();
                }}
                height={400}
                headerComponent={
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {"Sales Data"}
                  </Typography>
                }
              />
            </Grid>
          </>
        )}

        {/* EVENT GRID */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {eventsError ? (
            <Alert severity="error">{eventsError}</Alert>
          ) : (
            <CustomDataGrid
              title="Events"
              rows={events}
              rowCount={total}
              columns={columns}
              isLoading={eventsLoading}
              error={eventsError as any}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              sortingModel={sortModel}
              setSortingModel={setSortModel}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              onRefresh={handleRefresh}
            />
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
