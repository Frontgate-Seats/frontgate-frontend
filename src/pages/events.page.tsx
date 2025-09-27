import * as React from "react";
import { useSelector } from "react-redux";
import { Box, Alert, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import DataGridPage from "../components/common/datagrid.comon";
import PageContainer from "./PageContainer";
import type { RootState } from "../store";
import { getEvents } from "../store/slices/events.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";

export default function EventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { rows, total, loading, error } = useSelector(
    (state: RootState) => state.events
  );

  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({
      page: 0,
      pageSize: 10,
    });

  // Fetch events whenever pagination changes
  React.useEffect(() => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
      })
    );
  }, [dispatch, paginationModel]);

  const handlePaginationModelChange = (model: GridPaginationModel) => {
    setPaginationModel(model);
  };

  const handleRefresh = () => {
    dispatch(
      getEvents({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
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

    // Venue
    { field: "venueId", headerName: "Venue ID" },

    // Performer
    { field: "performerIds", headerName: "Performer Ids" },

    // // Inventary
    // {
    //   field: "inventory",
    //   headerName: "ListingCount",
    //   valueGetter: (params: any) => params.row.inventory?.listingCount ?? 0,
    //   filterable: false,
    //   sortable: false,
    // },
    // {
    //   field: "inventory",
    //   headerName: "TicketCount",
    //   valueGetter: (params: any) => params?.ticketCount ?? 0,
    //   filterable: false,
    //   sortable: false,
    // },
    // {
    //   field: "inventory",
    //   headerName: "ExclusiveListingCount",
    //   valueGetter: (params: any) => params?.exclusiveListingCount ?? 0,
    //   filterable: false,
    //   sortable: false,
    // },

    // Actions
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
    <PageContainer title="" breadcrumbs={[{ title: "" }]}>
      <Box sx={{ width: "100%" }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <DataGridPage
            rows={rows}
            rowCount={total}
            onRefresh={handleRefresh}
            isLoading={loading}
            error={error as any}
            paginationModel={paginationModel}
            setPaginationModel={handlePaginationModelChange}
            columns={columns}
          />
        )}
      </Box>
    </PageContainer>
  );
}
