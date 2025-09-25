import * as React from "react";
import { useSelector } from "react-redux";
import { Box, Alert, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";

import DataGridPage from "../components/common/datagrid.comon";
import PageContainer from "./PageContainer";
import type { RootState } from "../store";
import { getEvents } from "../store/slices/event.slice";
import { useAppDispatch } from "../store/reducers/root.reducer";

export default function EventsPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { rows, total, loading, error } = useSelector((state: RootState) => state.event);

    const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
        page: 0,
        pageSize: 10,
    });

    // Fetch events whenever pagination changes
    React.useEffect(() => {
        dispatch(getEvents({ page: paginationModel.page, pageSize: paginationModel.pageSize }));
    }, [dispatch, paginationModel]);

    const handlePaginationModelChange = (model: GridPaginationModel) => {
        setPaginationModel(model);
    };

    const handleRefresh = () => {
        dispatch(getEvents({ page: paginationModel.page, pageSize: paginationModel.pageSize }));
    };

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID" },
        { field: "eventName", headerName: "Event Name", flex: 1 },
        { field: "performerName", headerName: "Performer", width: 160 },
        {
            field: "eventDate",
            headerName: "Date",
            type: "date",
            width: 120,
            valueGetter: (params) => {
                const value = params;
                return value ? new Date(value) : null;
            },
        },
        { field: "eventTime", headerName: "Time", width: 100 },
        { field: "section", headerName: "Section", width: 80 },
        { field: "row", headerName: "Row", width: 80 },
        {
            field: "price",
            headerName: "Price",
            type: "number",
            width: 100,
            valueGetter: (params) => {
                const value = params;
                return value != null ? `$${value}` : "-";
            },
        },
        {
            field: "actions",
            type: "actions",
            getActions: (params) => [
                <Button
                    key={params.row.id}
                    variant="contained"
                    color="info"
                    sx={{ m: 1 }}
                    onClick={() => navigate(`/listings/${params.row.id}`)}
                >
                    <Typography>View</Typography>
                </Button>,
            ],
        },
    ];


    return (
        <PageContainer title="Events" breadcrumbs={[{ title: "Events" }]}>
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
