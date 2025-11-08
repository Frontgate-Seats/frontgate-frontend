// client/src/pages/ChartsPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
} from "@mui/material";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { fetchTopEvents, setField } from "../store/slices/charts.slice";
import moment from "moment";
import CustomDataGrid from "../components/common/datagrid/CustomDatagrid";
import type {
  GridPaginationModel,
  GridSortModel,
  GridFilterModel,
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../shared/types/mui.type";
import dayjs from "dayjs";

const ChartsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    field,
    data: rows,
    loading,
    error,
  } = useSelector((s: RootState) => s.charts);

  const [timeRange, setTimeRange] = useState<string>("10m");
  const [from, setFrom] = useState<string>("");

  const timeRangeOptions = [
    { value: "10m", label: "Last 10 Minutes" },
    { value: "30m", label: "Last 30 Minutes" },
    { value: "1h", label: "Last 1 Hour" },
    { value: "6h", label: "Last 6 Hours" },
    { value: "12h", label: "Last 12 Hours" },
    { value: "1d", label: "Last 1 Day" },
    { value: "3d", label: "Last 3 Days" },
    { value: "7d", label: "Last 7 Days" },
    { value: "15d", label: "Last 15 Days" },
    { value: "1M", label: "Last 1 Month" },
  ];

  const fieldOptions = [
    { value: "allInPriceAverage", label: "All-In Price Average" },
    { value: "allInPriceMin", label: "All-In Price Min" },
    { value: "allInPriceMax", label: "All-In Price Max" },
    { value: "allInPriceMedian", label: "All-In Price Median" },
    { value: "priceAverage", label: "Price Average" },
    { value: "priceMin", label: "Price Min" },
    { value: "priceMax", label: "Price Max" },
    { value: "priceMedian", label: "Price Median" },
    { value: "getInPriceAverage", label: "Get-In Price Average" },
    { value: "getInPriceMin", label: "Get-In Price Min" },
    { value: "getInPriceMax", label: "Get-In Price Max" },
    { value: "getInPriceMedian", label: "Get-In Price Median" },
    { value: "twoPlusPriceAverage", label: "2+ Price Average" },
    { value: "twoPlusPriceMin", label: "2+ Price Min" },
    { value: "twoPlusPriceMax", label: "2+ Price Max" },
    { value: "twoPlusPriceMedian", label: "2+ Price Median" },
  ];

  const computeRange = (range: string) => {
    let fromDate = moment.utc();

    if (range.endsWith("m"))
      fromDate = fromDate.subtract(parseInt(range, 10), "minutes");
    else if (range.endsWith("h"))
      fromDate = fromDate.subtract(parseInt(range, 10), "hours");
    else if (range.endsWith("d"))
      fromDate = fromDate.subtract(parseInt(range, 10), "days");
    else if (range.endsWith("M"))
      fromDate = fromDate.subtract(parseInt(range, 10), "months");

    setFrom(fromDate.toISOString());
  };

  useEffect(() => {
    computeRange(timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!from || !field) return;
    dispatch(fetchTopEvents({ from, field }));
  }, [dispatch, from, field]);

  const handleRefresh = () => computeRange(timeRange);

  // ------------------- DataGrid columns -------------------
  const columns: CustomGridColDef[] = [
    {
      field: "eventId",
      headerName: "Event ID",
      flex: 1.2,
      minWidth: 150,
      type: "string",
    },
    {
      field: "startValue",
      headerName: "Start Value",
      flex: 0.8,
      minWidth: 120,
      min: 0,
      max: 10000,
      type: "number",
    },
    {
      field: "endValue",
      headerName: "End Value",
      flex: 0.8,
      minWidth: 120,
      min: 0,
      max: 10000,
      type: "number",
    },
    {
      field: "change",
      headerName: "Change",
      flex: 0.8,
      minWidth: 120,
      min: 0,
      max: 10000,
      type: "number",
    },
    {
      field: "percentChange",
      headerName: "% Change",
      flex: 0.8,
      minWidth: 120,
      type: "number",
      min: 0,
      max: 10000,
      valueFormatter: (v) => (v != null ? `${Number(v).toFixed(2)}%` : "-"),
      cellClassName: (params) =>
        params.value > 0
          ? "text-green-600 font-medium"
          : params.value < 0
          ? "text-red-600 font-medium"
          : "",
    },
  ];

  // ------------------- Grid models -------------------
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  const filteredRows = React.useMemo(() => {
    if (!filterModel?.items?.length) return rows;

    return rows.filter((row) =>
      filterModel.items.every(({ field, operator, value }) => {
        if (value == null || value === "") return true;

        const col = columns.find((c) => c.field === field);
        const colType = col?.type || "string";
        const fieldValue = row[field];

        switch (colType) {
          // -------------------- TEXT --------------------
          default: {
            if (operator === "contains") {
              return String(fieldValue ?? "")
                .toLowerCase()
                .includes(String(value).toLowerCase());
            }
            if (operator === "equals") {
              return (
                String(fieldValue ?? "").toLowerCase() ===
                String(value).toLowerCase()
              );
            }
            return true;
          }

          // -------------------- NUMBER --------------------
          case "number": {
            const fv = Number(fieldValue);
            const val = Number(value);
            if (isNaN(fv) || isNaN(val)) return false;

            if (operator === ">=") return fv >= val;
            if (operator === "<=") return fv <= val;
            if (operator === "equals") return fv === val;
            return true;
          }

          // -------------------- DATE --------------------
          case "date":
          case "dateTime": {
            const fv = dayjs(fieldValue);
            const val = dayjs(value);
            if (!fv.isValid() || !val.isValid()) return false;

            if (operator === "onOrAfter")
              return fv.isSame(val, "day") || fv.isAfter(val, "day");
            if (operator === "onOrBefore")
              return fv.isSame(val, "day") || fv.isBefore(val, "day");
            return true;
          }

          // -------------------- SINGLE SELECT --------------------
          case "singleSelect": {
            return String(fieldValue ?? "") === String(value);
          }
        }
      })
    );
  }, [filterModel, columns]);

  const sortedRows = React.useMemo(() => {
    if (!sortModel?.length) return filteredRows;

    const { field, sort } = sortModel[0];
    return [...filteredRows].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (aValue < bValue) return sort === "asc" ? -1 : 1;
      if (aValue > bValue) return sort === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortModel]);

  const paginatedRows = React.useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    const end = start + paginationModel.pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, paginationModel]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Top Events by % Increase
      </Typography>

      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <FormControl size="small">
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as string)}
            label="Time Range"
            sx={{ minWidth: 180 }}
          >
            {timeRangeOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Field</InputLabel>
          <Select
            value={field}
            onChange={(e) => dispatch(setField(e.target.value as string))}
            label="Field"
            sx={{ minWidth: 220 }}
          >
            {fieldOptions.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleRefresh}>
          Refresh
        </Button>
      </Box>

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Card variant="outlined">
          <CardContent>
            {loading ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                py={6}
              >
                <CircularProgress />
              </Box>
            ) : (
              <CustomDataGrid
                title="Top Events"
                rows={paginatedRows}
                rowCount={rows.length}
                isLoading={loading}
                error={error as any}
                columns={columns}
                paginationModel={paginationModel}
                setPaginationModel={setPaginationModel}
                sortingModel={sortModel}
                setSortingModel={setSortModel}
                filterModel={filterModel}
                setFilterModel={setFilterModel}
                onRefresh={handleRefresh}
              />
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ChartsPage;
