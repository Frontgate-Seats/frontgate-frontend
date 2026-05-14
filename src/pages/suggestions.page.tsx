import * as React from "react";
import { useSelector } from "react-redux";
import { Stack, Grid, IconButton, Typography, Link } from "@mui/material";
import { Edit } from "@mui/icons-material";

import type { RootState } from "../store";
import { formatDateTime } from "../shared/utils/dateTime.util";
import { getSuggests, updateSuggest } from "../store/slices/suggests.slice";
import type { UpdateSuggestPayload } from "../apis/suggests.api";
import { useAppDispatch } from "../store/reducers/root.reducer";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { SuggestionDialog } from "../components/common/dialogs";
import { useDataGridQueryParams } from "../hooks/useDataGridQueryParams";

export default function SuggestionsPage() {
  const dispatch = useAppDispatch();

  // Redux Data
  const {
    rows: { data: suggests, total },
    loading: suggestsLoading,
    error: suggestsError,
  } = useSelector((state: RootState) => state.suggests);

  // Grid State — synced with URL query params
  const defaultSuggestionsFilter = React.useMemo(() => ({
    items: [{ field: "llm_type", operator: "equals", value: "event-signal" }],
  }), []);

  const { paginationModel, setPaginationModel, sortModel, setSortModel, filterModel, setFilterModel } =
    useDataGridQueryParams({
      columns: [
        { field: "event_id", type: "number" },
        { field: "event_name", type: "string" },
        { field: "created_at", type: "dateTime" },
        { field: "llm_result_comment", type: "string" },
        { field: "llm_result_score", type: "number" },
        // filterOperator: "equals" ensures the operator is preserved on URL reload
        { field: "llm_type", type: "string", filterOperator: "equals" },
      ],
      defaultPaginationModel: { page: 0, pageSize: 25 },
      defaultSortModel: [{ field: "created_at", sort: "desc" }],
      defaultFilterModel: defaultSuggestionsFilter,
    });

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingSuggest, setEditingSuggest] = React.useState<any>(null);
  const [editComment, setEditComment] = React.useState("");
  const [editScore, setEditScore] = React.useState<number | null>(null);

  // Fetch Data
  React.useEffect(() => {
    dispatch(
      getSuggests({
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
      getSuggests({
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

  // Edit Dialog Handlers
  const handleOpenEditDialog = (suggest: any) => {
    setEditingSuggest(suggest);
    setEditComment(suggest.llm_result_comment || "");
    setEditScore(suggest.llm_result_score ?? null);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingSuggest(null);
    setEditComment("");
    setEditScore(null);
  };

  const handleSaveEdit = async () => {
    if (!editingSuggest) return;

    const payload: UpdateSuggestPayload = {
      id: editingSuggest.id,
      llm_result_comment: editComment,
      llm_result_score: editScore,
    };

    await dispatch(
      updateSuggest({
        payload,
        queryOptions: {
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          sortFields: sortModel,
          filters: filterModel,
        },
      }),
    );

    handleCloseEditDialog();
  };

  // Column Definitions (no valueGetter for nested fields - server-side filtering only)
  const columns: CustomGridColDef[] = [
    {
      field: "event_id",
      headerName: "Event ID",
      width: 120,
      type: "number",
      renderCell: (params) => {
        return (
          <Link
            href={`/functions/v1/events-api/ui/events/${params.value}`}
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
      field: "event_name",
      headerName: "Event Name",
      flex: 1,
      minWidth: 200,
      type: "string",
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => (value ? formatDateTime(value) : "-"),
    },
    {
      field: "action",
      headerName: "Action",
      width: 100,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) => row?.llm_result?.action ?? "-",
    },
    {
      field: "section",
      headerName: "Section",
      width: 150,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) => row?.llm_result?.section ?? "-",
    },
    {
      field: "confidence_level",
      headerName: "Confidence",
      width: 120,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) =>
        row?.llm_result?.confidence_level ?? "-",
    },
    {
      field: "reasoning",
      headerName: "Reasoning",
      flex: 2,
      minWidth: 300,
      type: "string",
      sortable: false,
      filterable: false,
      valueGetter: (_value: any, row: any) => row?.llm_result?.reasoning ?? "-",
    },
    {
      field: "llm_result_comment",
      headerName: "Comment",
      flex: 1,
      minWidth: 200,
      type: "string",
    },
    {
      field: "llm_result_score",
      headerName: "Score",
      width: 100,
      type: "number",
      valueFormatter: (value: any) =>
        typeof value === "number" ? value.toString() : "-",
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
        return (
          <IconButton
            onClick={() => handleOpenEditDialog(params.row)}
            size="small"
            aria-label="Edit suggestion"
          >
            <Edit />
          </IconButton>
        );
      },
    },
  ];

  // Render
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
            rows={suggests}
            rowCount={total}
            columns={columns}
            isLoading={suggestsLoading}
            error={suggestsError as any}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            sortingModel={sortModel}
            setSortingModel={setSortModel}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            onRefresh={handleRefresh}
            headerComponent={
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Suggestions
              </Typography>
            }
          />
        </Grid>
      </Grid>

      {/* Edit Suggestion Dialog */}
      <SuggestionDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        suggestion={editingSuggest}
        comment={editComment}
        score={editScore}
        onCommentChange={setEditComment}
        onScoreChange={setEditScore}
        onSubmit={handleSaveEdit}
      />
    </Stack>
  );
}
