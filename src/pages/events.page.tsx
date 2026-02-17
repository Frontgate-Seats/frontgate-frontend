import * as React from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Grid,
  Stack,
  Link,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  BarChart,
  MoreVert,
  Visibility,
  PlayArrow,
  Stop,
} from "@mui/icons-material";
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
import {
  getEvents,
  startEventMonitoring,
  stopEventMonitoring,
} from "../store/slices/events.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import {
  ConfirmDialog,
  StartMonitoringDialog,
  type MonitorLevel,
} from "../components/common/dialogs";

export default function EventsPage() {
  const dispatch = useAppDispatch();

  // ------------------------
  // Redux Data
  // ------------------------
  const {
    rows: { data: events, total },
    loading: eventsLoading,
    error: eventsError,
  } = useSelector((state: RootState) => state.events);

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
  // Confirmation Dialog State
  // ------------------------
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    eventId: string | null;
    eventName: string | null;
  }>({
    open: false,
    eventId: null,
    eventName: null,
  });

  // ------------------------
  // Start Monitoring Dialog State
  // ------------------------
  const [startMonitoringDialog, setStartMonitoringDialog] = React.useState<{
    open: boolean;
    eventId: string | null;
    eventName: string | null;
  }>({
    open: false,
    eventId: null,
    eventName: null,
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

  const handleConfirmStopMonitoring = () => {
    if (confirmDialog.eventId) {
      const queryOptions = {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      };
      dispatch(
        stopEventMonitoring({ eventId: confirmDialog.eventId, queryOptions }),
      );
    }
    setConfirmDialog({ open: false, eventId: null, eventName: null });
  };

  const handleCancelStopMonitoring = () => {
    setConfirmDialog({ open: false, eventId: null, eventName: null });
  };

  const handleConfirmStartMonitoring = (monitorLevel: MonitorLevel) => {
    if (startMonitoringDialog.eventId) {
      const queryOptions = {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      };
      dispatch(
        startEventMonitoring({
          eventId: startMonitoringDialog.eventId,
          monitorLevel,
          queryOptions,
        }),
      );
    }
    setStartMonitoringDialog({ open: false, eventId: null, eventName: null });
  };

  const handleCancelStartMonitoring = () => {
    setStartMonitoringDialog({ open: false, eventId: null, eventName: null });
  };

  const getMonitorLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

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
        <Tooltip title="View Event Details">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `/functions/v1/events-api/ui/events/${params.row.id}`,
                "_blank",
              );
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
      field: "monitor_level",
      headerName: "Monitor Level",
      minWidth: 150,
      type: "singleSelect",
      valueOptions: ["none", "low", "medium", "high", "critical"],
      renderCell: (params) => {
        const level = params.value;
        if (!level || level === "none") {
          return <span>-</span>;
        }
        return (
          <Chip
            label={level.charAt(0).toUpperCase() + level.slice(1)}
            color={getMonitorLevelColor(level)}
            size="small"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      align: "center",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const eventId = params.row.id.toString();
        const isMonitoring = params.row.is_monitored || false;

        const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(
          null,
        );
        const open = Boolean(anchorEl);

        const handleClick = (event: React.MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        };

        const handleClose = () => {
          setAnchorEl(null);
        };

        const handleViewListings = () => {
          window.open(
            `/functions/v1/events-api/ui/listings/${params.row.id}`,
            "_blank",
          );
          handleClose();
        };

        const handleToggleMonitoring = () => {
          if (isMonitoring) {
            // Show confirmation dialog for stopping monitoring
            setConfirmDialog({
              open: true,
              eventId,
              eventName: params.row.name,
            });
          } else {
            // Show start monitoring dialog with level selection
            setStartMonitoringDialog({
              open: true,
              eventId,
              eventName: params.row.name,
            });
          }
          handleClose();
        };

        return (
          <>
            <IconButton
              onClick={handleClick}
              size="small"
              aria-controls={open ? "actions-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
              <MoreVert />
            </IconButton>
            <Menu
              id="actions-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              slotProps={{
                paper: {
                  "aria-labelledby": "actions-button",
                },
              }}
            >
              <MenuItem onClick={handleViewListings}>
                <ListItemIcon>
                  <Visibility fontSize="small" />
                </ListItemIcon>
                <ListItemText>View Listings</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleToggleMonitoring}>
                <ListItemIcon>
                  {isMonitoring ? (
                    <Stop fontSize="small" />
                  ) : (
                    <PlayArrow fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {isMonitoring ? "Stop Monitor" : "Start Monitor"}
                </ListItemText>
              </MenuItem>
            </Menu>
          </>
        );
      },
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={handleCancelStopMonitoring}
        onConfirm={handleConfirmStopMonitoring}
        title="Stop Monitoring Event?"
        message={
          <>
            Are you sure you want to stop monitoring "{confirmDialog.eventName}
            "?
            <br />
            <br />
            This will stop collecting listings and sales data for this event.
          </>
        }
        confirmLabel="Stop Monitoring"
        cancelLabel="Cancel"
        confirmColor="error"
        severity="warning"
      />

      {/* Start Monitoring Dialog */}
      <StartMonitoringDialog
        open={startMonitoringDialog.open}
        eventName={startMonitoringDialog.eventName}
        onClose={handleCancelStartMonitoring}
        onConfirm={handleConfirmStartMonitoring}
      />
    </Stack>
  );
}
