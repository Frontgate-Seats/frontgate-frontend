// client/src/pages/ChartsPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useAppDispatch } from "../store/reducers/root.reducer";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { fetchTopEvents, setField, setLimit } from "../store/slices/charts.slice";
import moment from "moment";

const ChartsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { field, limit, data, loading, error } = useSelector((s: RootState) => s.charts);

  const [timeRange, setTimeRange] = useState<string>("10m");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const timeRangeOptions = [
    { value: "10m", label: "Last 10 Minutes" },
    { value: "30m", label: "Last 30 Minutes" },
    { value: "1h", label: "Last 1 Hour" },
    { value: "6h", label: "Last 6 Hours" },
    { value: "1d", label: "Last 1 Day" },
  ];

  // All numeric price fields from ListingsMeta
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

  const limitOptions = [5, 10, 20, 30, 50];

  // Compute from/to based on time range
  const computeRange = (range: string) => {
    const toDate = moment.utc();
    let fromDate = moment.utc();

    if (range.endsWith("m")) fromDate = fromDate.subtract(parseInt(range, 10), "minutes");
    else if (range.endsWith("h")) fromDate = fromDate.subtract(parseInt(range, 10), "hours");
    else if (range.endsWith("d")) fromDate = fromDate.subtract(parseInt(range, 10), "days");

    setFrom(fromDate.toISOString());
    setTo(toDate.toISOString());
  };

  useEffect(() => {
    computeRange(timeRange);
  }, [timeRange]);

  // Fetch top events whenever from/to/field/limit changes
  useEffect(() => {
    if (!from || !to || !field) return;
    dispatch(fetchTopEvents({ from, to, field, limit }));
  }, [dispatch, from, to, field, limit]);

  const handleRefresh = () => computeRange(timeRange);

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2} fontWeight="bold">
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

        <FormControl size="small">
          <InputLabel>Limit</InputLabel>
          <Select
            value={limit}
            onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
            label="Limit"
            sx={{ minWidth: 100 }}
          >
            {limitOptions.map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" color="primary" onClick={handleRefresh}>
          Refresh
        </Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box textAlign="center" py={6}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          ) : !data?.length ? (
            <Typography textAlign="center" color="text.secondary">
              No data available
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event ID</TableCell>
                  <TableCell>Event Name</TableCell>
                  <TableCell>First (UTC)</TableCell>
                  <TableCell>Last (UTC)</TableCell>
                  <TableCell>Start Value</TableCell>
                  <TableCell>End Value</TableCell>
                  <TableCell>% Change</TableCell>
                  <TableCell>Listings</TableCell>
                  <TableCell>Max Tickets</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{row.eventId}</TableCell>
                    <TableCell>{row.name ?? "-"}</TableCell>
                    <TableCell>
                      {row.firstTime ? moment.utc(row.firstTime).format("YYYY-MM-DD HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      {row.lastTime ? moment.utc(row.lastTime).format("YYYY-MM-DD HH:mm") : "-"}
                    </TableCell>
                    <TableCell>{row.firstValue != null ? `$${row.firstValue}` : "-"}</TableCell>
                    <TableCell>{row.lastValue != null ? `$${row.lastValue}` : "-"}</TableCell>
                    <TableCell>
                      {row.percentChange != null ? `${row.percentChange}%` : "-"}
                    </TableCell>
                    <TableCell>{row.totalListings ?? "-"}</TableCell>
                    <TableCell>{row.maxTickets ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChartsPage;
