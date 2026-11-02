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
import { startOfDay, endOfDay } from '../../shared/utils/dateTime.util';
import { resolveDateRange } from '../../shared/utils/timeRange.util';
import type {
  DateFilterProps,
  TimeRangeFilter,
} from '../../types/dashboard.types';

// RANGE_OPTIONS is driven directly by TIME_RANGE_OPTIONS — single source of truth.
const RANGE_OPTIONS: { value: TimeRangeFilter; label: string }[] =
  TIME_RANGE_OPTIONS as { value: TimeRangeFilter; label: string }[];

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
    onDateRangeChange(resolveDateRange(initialFilter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeChange = useCallback(
    (e: SelectChangeEvent) => {
      const value = e.target.value as TimeRangeFilter;
      setRange(value);
      setError(null);
      if (value !== 'custom') {
        onDateRangeChange(resolveDateRange(value));
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
    onDateRangeChange({ startDate: startOfDay(customStart), endDate: endOfDay(customEnd) });
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
