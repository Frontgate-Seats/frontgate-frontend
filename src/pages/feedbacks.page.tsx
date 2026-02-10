import * as React from "react";
import { useSelector } from "react-redux";
import {
  Stack,
  Grid,
  IconButton,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";

import type { RootState } from "../store";
import { formatDateTime } from "../shared/utils/dateTime.util";
import {
  getFeedbacks,
  updateFeedback,
} from "../store/slices/feedbacks.slice";
import type { UpdateFeedbackPayload } from "../apis/feedbacks.api";
import { useAppDispatch } from "../store/reducers/root.reducer";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import { FormDialog } from "../components/common/dialogs";

export default function FeedbacksPage() {
  const dispatch = useAppDispatch();

  // ------------------------
  // Redux Data
  // ------------------------
  const {
    rows: { data: feedbacks, total },
    loading: feedbacksLoading,
    error: feedbacksError,
  } = useSelector((state: RootState) => state.feedbacks);

  // ------------------------
  // Grid State
  // ------------------------
  const [paginationModel, setPaginationModel] =
    React.useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "created_at", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
  });

  // ------------------------
  // Edit Dialog State
  // ------------------------
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingFeedback, setEditingFeedback] = React.useState<any>(null);
  const [editComment, setEditComment] = React.useState("");

  // ------------------------
  // Fetch Data
  // ------------------------
  React.useEffect(() => {
    dispatch(
      getFeedbacks({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  const handleRefresh = React.useCallback(() => {
    dispatch(
      getFeedbacks({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sortFields: sortModel,
        filters: filterModel,
      })
    );
  }, [dispatch, paginationModel, sortModel, filterModel]);

  // ------------------------
  // Edit Dialog Handlers
  // ------------------------
  const handleOpenEditDialog = (feedback: any) => {
    setEditingFeedback(feedback);
    setEditComment(feedback.comment || "");
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingFeedback(null);
    setEditComment("");
  };

  const handleSaveEdit = () => {
    if (!editingFeedback) return;

    const payload: UpdateFeedbackPayload = {
      id: editingFeedback.id,
      comment: editComment,
    };

    dispatch(
      updateFeedback({
        payload,
        queryOptions: {
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          sortFields: sortModel,
          filters: filterModel,
        },
      })
    );

    handleCloseEditDialog();
  };

  // ------------------------
  // Column Definitions
  // ------------------------
  const columns: CustomGridColDef[] = [
    {
      field: "event_id",
      headerName: "Event ID",
      width: 150,
      type: "string",
      valueFormatter: (value: any) => value?.toString() || "",
    },
    {
      field: "comment",
      headerName: "Comment",
      flex: 1,
      minWidth: 300,
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => formatDateTime(value),
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 180,
      type: "dateTime",
      valueGetter: (value) => (value ? new Date(value) : null),
      valueFormatter: (value) => formatDateTime(value),
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
            aria-label="Edit feedback"
          >
            <Edit />
          </IconButton>
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
            title="Feedbacks"
            rows={feedbacks}
            rowCount={total}
            columns={columns}
            isLoading={feedbacksLoading}
            error={feedbacksError as any}
            paginationModel={paginationModel}
            setPaginationModel={setPaginationModel}
            sortingModel={sortModel}
            setSortingModel={setSortModel}
            filterModel={filterModel}
            setFilterModel={setFilterModel}
            onRefresh={handleRefresh}
          />
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <FormDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        title="Edit Feedback"
        fields={[
          {
            name: "comment",
            label: "Comment",
            type: "textarea",
            value: editComment,
            onChange: setEditComment,
            rows: 4,
            autoFocus: true,
          },
        ]}
        onSubmit={handleSaveEdit}
        submitLabel="Save"
        cancelLabel="Cancel"
      />
    </Stack>
  );
}
