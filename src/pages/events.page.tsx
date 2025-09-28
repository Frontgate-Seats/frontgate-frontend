import * as React from "react";
import { useSelector } from "react-redux";
import { Box, Alert, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";

import DataGridPage from "../components/common/datagrid.comon";
import type { RootState } from "../store";
import { getEvents } from "../store/slices/events.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    rows: { data, total },
    loading,
    error,
  } = useSelector((state: RootState) => state.events);

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 10,
    });

  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  // 🔑 Extract values for backend
  const sortField = sortModel[0]?.field || undefined;
  const sortOrder = sortModel[0]?.sort || undefined;
  const filters = filterModel?.items?.length ? filterModel : undefined;

  // Fetch events whenever pagination, sort, filter, or search changes
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

  const columns: GridColDef[] = [
    { field: "eventId", headerName: "Event ID" },
    { field: "name", headerName: "Event Name", flex: 1 },

    // Date & Time
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

    // { field: "venueId", headerName: "Venue ID" },
    // { field: "performerIds", headerName: "Performer Ids" },
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
          onClick={() => navigate(`/events/${params.row.eventId}/listings`)}
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
          // autoHeight
        />
      )}
    </Box>
  );
}
