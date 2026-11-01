/**
 * DashboardFilter Component
 *
 * A "Filters" accordion (open by default) holding a time-range filter that
 * mirrors the charts on the event details page (TIME_RANGE_OPTIONS) plus an
 * optional custom start/end range.
 *
 * Default = "Last Week" (7d).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { TIME_RANGE_OPTIONS } from '../../shared/constants/components.constants';
import type {
  DateRange,
  DateFilterProps,
  TimeRangeFilter,
} from '../../types/dashboard.types';

// "All Time" lower bound — early enough to predate any inventory.
const ALL_TIME_START = new Date('2000-01-01T00:00:00Z');

// Time-range options for the dashboard: the shared chart ranges + a Custom entry.
const RANGE_OPTIONS: { value: TimeRangeFilter; label: string }[] = [
  ...(TIME_RANGE_OPTIONS as { value: TimeRangeFilter; label: string }[]),
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' },
];

/** Resolve a time-range token into a concrete {startDate, endDate}. */
function rangeFor(value: TimeRangeFilter): DateRange {
  const end = new Date();
  const start = new Date();

  // Day/month/year ranges snap the start to midnight (start of day) so the
  // window is calendar-based — matching SkyBox's "last N days" which counts
  // from the start of the day N days ago, not a rolling 168h-type cutoff.
  const atStartOfDay = (d: Date) => {
    d.setHours(0, 0, 0, 0);
    return d;
  };

  switch (value) {
    case 'all':
      return { startDate: ALL_TIME_START, endDate: end };
    // Intraday ranges stay rolling.
    case '1h':  start.setHours(start.getHours() - 1); break;
    case '3h':  start.setHours(start.getHours() - 3); break;
    case '6h':  start.setHours(start.getHours() - 6); break;
    case '12h': start.setHours(start.getHours() - 12); break;
    // Calendar-day ranges snap to the start of the day.
    case '1d':  start.setDate(start.getDate() - 1);  return { startDate: atStartOfDay(start), endDate: end };
    case '7d':  start.setDate(start.getDate() - 7);  return { startDate: atStartOfDay(start), endDate: end };
    case '30d': start.setDate(start.getDate() - 30); return { startDate: atStartOfDay(start), endDate: end };
    case '3m':  start.setMonth(start.getMonth() - 3); return { startDate: atStartOfDay(start), endDate: end };
    case '6m':  start.setMonth(start.getMonth() - 6); return { startDate: atStartOfDay(start), endDate: end };
    case '1y':  start.setFullYear(start.getFullYear() - 1); return { startDate: atStartOfDay(start), endDate: end };
    case 'ytd': return { startDate: new Date(end.getFullYear(), 0, 1), endDate: end };
    default:    return { startDate: ALL_TIME_START, endDate: end };
  }
  return { startDate: start, endDate: end };
}

export default function DashboardFilter({
  onDateRangeChange,
  initialFilter = '7d',
}: DateFilterProps) {
  const [range, setRange] = useState<TimeRangeFilter>(initialFilter);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Emit the initial range once on mount.
  useEffect(() => {
    onDateRangeChange(rangeFor(initialFilter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = useCallback(
    (e: SelectChangeEvent) => {
      const value = e.target.value as TimeRangeFilter;
      setRange(value);
      setError(null);
      if (value !== 'custom') {
        onDateRangeChange(rangeFor(value));
      }
    },
    [onDateRangeChange],
  );

  const applyCustom = useCallback(() => {
    if (!customStart || !customEnd) {
      setError('Please select both start and end dates');
      return;
    }
    if (customStart > customEnd) {
      setError('Start date must be before end date');
      return;
    }
    setError(null);
    onDateRangeChange({ startDate: customStart, endDate: customEnd });
  }, [customStart, customEnd, onDateRangeChange]);

  const activeLabel =
    RANGE_OPTIONS.find((o) => o.value === range)?.label ?? 'All Time';

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Accordion
        defaultExpanded
        disableGutters
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          '&:before': { display: 'none' },
          overflow: 'hidden',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: 'action.hover',
            '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 },
          }}
        >
          <FilterListIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            Filters
          </Typography>
          <Chip
            size="small"
            label={activeLabel}
            color={range === 'all' ? 'default' : 'primary'}
            variant={range === 'all' ? 'outlined' : 'filled'}
            sx={{ ml: 1, fontWeight: 600 }}
          />
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="dashboard-range-label">Time Range</InputLabel>
              <Select
                labelId="dashboard-range-label"
                label="Time Range"
                value={range}
                onChange={handleRangeChange}
              >
                {RANGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {range === 'custom' && (
              <>
                <DatePicker
                  label="Start Date"
                  format="DD/MM/YY"
                  value={customStart ? moment(customStart) : null}
                  onChange={(v) => setCustomStart(v ? v.toDate() : null)}
                  slotProps={{ textField: { size: 'small', error: !!error } }}
                />
                <DatePicker
                  label="End Date"
                  format="DD/MM/YY"
                  value={customEnd ? moment(customEnd) : null}
                  onChange={(v) => setCustomEnd(v ? v.toDate() : null)}
                  slotProps={{ textField: { size: 'small', error: !!error } }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={applyCustom}
                  disabled={!customStart || !customEnd}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Apply
                </Button>
              </>
            )}
          </Stack>

          {error && (
            <Box mt={2}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </LocalizationProvider>
  );
}
