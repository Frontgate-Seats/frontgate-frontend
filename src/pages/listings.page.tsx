import * as React from "react";
import {
    useParams,
} from "react-router-dom";
import {
    type GridColDef,
    type GridPaginationModel,
} from "@mui/x-data-grid";
import DataGridPage from "../components/common/datagrid.comon";
import PageContainer from "./PageContainer";
import { Alert, Box } from "@mui/material";

const INITIAL_PAGE_SIZE = 10;


// ✅ Dummy Listings per event
const sampleListings = Array.from({ length: 100 }).map((_, idx) => ({
    id: idx + 1,
    listingId: `L-${idx + 1}`,
    eventId: (idx % 20) + 1, // map 100 listings to 20 events
    section: `Section ${Math.floor(idx / 5) + 1}`,
    row: `Row ${idx % 10}`,
    seat: `Seat ${idx + 100}`,
    price: (30 + idx * 3).toString(),
    seller: `Seller ${idx % 15}`,
}));


// ✅ ListingsPage
export default function ListingsPage() {
    const { id } = useParams();
    const eventId = Number(id);

    const eventListings = sampleListings.filter(
        (listing) => listing.eventId === eventId
    );

    const [paginationModel, setPaginationModel] =
        React.useState<GridPaginationModel>({
            page: 0,
            pageSize: INITIAL_PAGE_SIZE,
        });

    const [rowsState, setRowsState] = React.useState({
        rows: eventListings.slice(
            paginationModel.page * paginationModel.pageSize,
            paginationModel.page * paginationModel.pageSize + paginationModel.pageSize
        ),
        rowCount: eventListings.length,
    });

    const [isLoading, setIsLoading] = React.useState(false);
    const [error] = React.useState<Error | null>(null);

    const handlePaginationModelChange = React.useCallback(
        (model: GridPaginationModel) => {
            setPaginationModel(model);
            setRowsState({
                rows: eventListings.slice(
                    model.page * model.pageSize,
                    model.page * model.pageSize + model.pageSize
                ),
                rowCount: eventListings.length,
            });
        },
        [eventListings]
    );

    const handleRefresh = React.useCallback(() => {
        if (!isLoading) {
            setRowsState({
                rows: eventListings.slice(
                    paginationModel.page * paginationModel.pageSize,
                    paginationModel.page * paginationModel.pageSize +
                    paginationModel.pageSize
                ),
                rowCount: eventListings.length,
            });
        }
    }, [isLoading, paginationModel, eventListings]);

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 90 },
        { field: "listingId", headerName: "Listing ID", flex: 1 },
        { field: "section", headerName: "Section", width: 120 },
        { field: "row", headerName: "Row", width: 120 },
        { field: "seat", headerName: "Seat", width: 120 },
        {
            field: "price",
            headerName: "Price",
            type: "number",
            width: 100,
            valueGetter: ({ value }) => `$${value}`,
        },
        { field: "seller", headerName: "Seller", flex: 1 },
    ];
    const pageTitle = "Events";

    return (
        <PageContainer
            title={pageTitle}
            breadcrumbs={[{ title: pageTitle }]}
        >
            <Box sx={{ flex: 1, width: "100%" }}>
                {error ? (
                    <Box sx={{ flexGrow: 1 }}>
                        <Alert severity="error">{error.message}</Alert>
                    </Box>
                ) : (
                    <DataGridPage
                        rows={rowsState.rows}
                        rowCount={rowsState.rowCount}
                        onRefresh={handleRefresh}
                        isLoading={isLoading}
                        error={error}
                        paginationModel={paginationModel}
                        setPaginationModel={handlePaginationModelChange}
                        columns={columns}
                    />
                )}

            </Box>
        </PageContainer>
    );
}
