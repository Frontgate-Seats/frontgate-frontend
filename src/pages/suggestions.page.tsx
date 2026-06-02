import * as React from "react";
import { useSelector } from "react-redux";
import { Stack, Grid, Typography, Link } from "@mui/material";

import type { RootState } from "../store";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { getEventAnalysisLogs } from "../store/slices/eventAnalysisLogs.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";

export default function SuggestionsPage() {
  const dispatch = useAppDispatch();

  // Redux Data
  const {
    rows: { data: logs, total },
    loading,
    error,
  } = useSelector((state: RootState) => state.eventAnalysisLogs);

  // Grid State — synced with URL query params
  const { paginationModel, setPaginationModel, sortModel, setSortModel, filterModel, setFilterModel } =
    useDataGridQueryParams({
      columns: [
        { field: "event_id", type: "number" },
        { field: "event_name", type: "string" },
        { field: "created_at", type: "dateTime" },
        { field: "llm_action", type: "string" },
        { field: "recommendation_count", type: "number" },
        { field: "monitor_level", type: "string" },
        { field: "days_to_event", type: "number" },
      ],
      defaultPaginationModel: { page: 0, pageSize: 25 },
      defaultSortModel: [{ field: "created_at", sort: "desc" }],
      defaultFilterModel: { items: [] },
    });

  // Fetch Data
  React.useEffect(() => {
    dispatch(
      getEventAnalysisLogs({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [
    dispatch,
    paginationModel.page,
    paginationModel.pageSize,
    sortModel,
    filterModel,
  ]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getEventAnalysisLogs({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      }),
    );
  }, [
    dispatch,
    paginationModel.page,
    paginationModel.pageSize,
    sortModel,
    filterModel,
  ]);

  // Column Definitions
  const columns: CustomGridColDef[] = [
    {
      field: "event_id",
      headerName: "Event ID",
      width: 120,
      type: "number",
      renderCell: (params) => (
        <Link
          href={`/events/${params.value}`}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "event_name",
      headerName: "Event Name",
      flex: 1,
      minWidth: 200,
      type: "string",
    },
    {
      field: "created_at",
      headerName: "Date & Time",
      width: 180,
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "llm_action",
      headerName: "Action",
      width: 130,
      type: "string",
    },
    {
      field: "recommendation_count",
      headerName: "Recommendations",
      width: 150,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toString() : "-",
    },
    {
      field: "monitor_level",
      headerName: "Monitor Level",
      width: 130,
      type: "string",
    },
    {
      field: "days_to_event",
      headerName: "Days to Event",
      width: 130,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toString() : "-",
    },
    {
      field: "event_assessment_action",
      headerName: "Assessment",
      width: 150,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.event_assessment?.recommended_action ?? "-",
    },
    {
      field: "demand_signal",
      headerName: "Demand Signal",
      width: 140,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.event_assessment?.demand_signal ?? "-",
    },
    {
      field: "reasoning",
      headerName: "Reasoning",
      flex: 2,
      minWidth: 300,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.event_assessment?.reasoning ?? "-",
    },
  ];

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
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <CustomDataGrid
            title="Suggestions"
            rows={logs}
            rowCount={total}
            columns={columns}
            isLoading={loading}
            error={error as any}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            sortingModel={sortModel}
            setSortingModel={setSortModel}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            onRefresh={handleRefresh}
            headerComponent={
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Buy Recommendations
              </Typography>
            }
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
