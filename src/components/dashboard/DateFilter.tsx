/**
 * DateFilter Component
 * 
 * Provides date range filtering with quick filters and custom date picker.
 * Supports "Last 7 Days", "Last 30 Days", "YTD", and custom date ranges.
 * 
 * Requirements Coverage:
 * - 6.1: Display four quick filter buttons
 * - 6.2: Default to "Last 7 Days" filter
 * - 6.3: Calculate "Last 7 Days" range
 * - 6.4: Calculate "Last 30 Days" range
 * - 6.5: Calculate "YTD" range
 * - 6.6: Display custom date range picker
 * - 6.7: Apply custom date range with validation
 * - 6.8: Emit onDateRangeChange events
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import type {
  DateRange,
  FilterType,
  DateFilterProps,
  ValidationResult,
} from '../../types/dashboard.types';

/**
 * DateFilter Component
 * 
 * Provides quick filter buttons and custom date range selection.
 * Validates custom ranges: start < end, max 365 days.
 */
export default function DateFilter({
  onDateRangeChange,
  initialFilter = 'last7days',
}: DateFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(initialFilter);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Calculates date range for "Last 7 Days" filter
   * Requirement 6.3: Calculate date range from 7 days ago to today
   */
  const calculateLast7Days = useCallback((): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    return { startDate, endDate };
  }, []);

  /**
   * Calculates date range for "Last 30 Days" filter
   * Requirement 6.4: Calculate date range from 30 days ago to today
   */
  const calculateLast30Days = useCallback((): DateRange => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    return { startDate, endDate };
  }, []);

  /**
   * Calculates date range for "YTD" (Year-to-Date) filter
   * Requirement 6.5: Calculate date range from January 1st of current year to today
   */
  const calculateYTD = useCallback((): DateRange => {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), 0, 1); // January 1st
    
    return { startDate, endDate };
  }, []);

  /**
   * Validates custom date range
   * Requirement 6.7: Ensure start < end and max 365 days
   * Requirement 19.2: Display validation error messages
   */
  const validateCustomRange = useCallback((start: Date, end: Date): ValidationResult => {
    // Check if start date is after end date
    if (start > end) {
      return {
        isValid: false,
        errorMessage: 'Start date must be before end date',
      };
    }

    // Check if range exceeds 365 days
    const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 365) {
      return {
        isValid: false,
        errorMessage: 'Date range limited to 365 days for performance',
      };
    }

    return { isValid: true };
  }, []);

  /**
   * Applies quick filter (Last 7 Days, Last 30 Days, YTD)
   * Requirement 6.1, 6.3, 6.4, 6.5: Apply predefined date range filters
   */
  const applyQuickFilter = useCallback((filterType: FilterType) => {
    setSelectedFilter(filterType);
    setValidationError(null);

    let dateRange: DateRange;

    switch (filterType) {
      case 'last7days':
        dateRange = calculateLast7Days();
        break;
      case 'last30days':
        dateRange = calculateLast30Days();
        break;
      case 'ytd':
        dateRange = calculateYTD();
        break;
      case 'custom':
        // Don't emit change until custom dates are selected
        return;
      default:
        dateRange = calculateLast7Days();
    }

    // Requirement 6.8: Emit onDateRangeChange event
    onDateRangeChange(dateRange);
  }, [calculateLast7Days, calculateLast30Days, calculateYTD, onDateRangeChange]);

  /**
   * Applies custom date range with validation
   * Requirement 6.6, 6.7: Apply and validate custom date range
   */
  const applyCustomFilter = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      setValidationError('Please select both start and end dates');
      return;
    }

    const validation = validateCustomRange(customStartDate, customEndDate);

    if (!validation.isValid) {
      setValidationError(validation.errorMessage || 'Invalid date range');
      return;
    }

    setValidationError(null);
    // Requirement 6.8: Emit onDateRangeChange event
    onDateRangeChange({
      startDate: customStartDate,
      endDate: customEndDate,
    });
  }, [customStartDate, customEndDate, validateCustomRange, onDateRangeChange]);

  /**
   * Initialize with default filter
   * Requirement 6.2: Apply "Last 7 Days" filter by default
   */
  useEffect(() => {
    if (initialFilter === 'last7days') {
      applyQuickFilter('last7days');
    }
  }, []); // Run only on mount

  /**
   * Handle custom filter button click
   * Requirement 6.6: Show custom date range picker
   */
  const handleCustomFilterClick = () => {
    setSelectedFilter('custom');
    setValidationError(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Date Range Filter
          </Typography>

          {/* Requirement 6.1: Display four quick filter buttons */}
          <ButtonGroup variant="outlined" aria-label="date filter button group">
            <Button
              variant={selectedFilter === 'last7days' ? 'contained' : 'outlined'}
              onClick={() => applyQuickFilter('last7days')}
            >
              Last 7 Days
            </Button>
            <Button
              variant={selectedFilter === 'last30days' ? 'contained' : 'outlined'}
              onClick={() => applyQuickFilter('last30days')}
            >
              Last 30 Days
            </Button>
            <Button
              variant={selectedFilter === 'ytd' ? 'contained' : 'outlined'}
              onClick={() => applyQuickFilter('ytd')}
            >
              YTD
            </Button>
            <Button
              variant={selectedFilter === 'custom' ? 'contained' : 'outlined'}
              onClick={handleCustomFilterClick}
            >
              Custom
            </Button>
          </ButtonGroup>

          {/* Requirement 6.6: Display custom date range picker when "Custom" is selected */}
          {selectedFilter === 'custom' && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <DatePicker
                  label="Start Date"
                  value={customStartDate ? moment(customStartDate) : null}
                  onChange={(newValue) => setCustomStartDate(newValue ? newValue.toDate() : null)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!validationError,
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={customEndDate ? moment(customEndDate) : null}
                  onChange={(newValue) => setCustomEndDate(newValue ? newValue.toDate() : null)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!validationError,
                    },
                  }}
                />
              </Stack>

              {/* Requirement 19.2, 19.3: Display validation error messages */}
              {validationError && (
                <Alert severity="error" onClose={() => setValidationError(null)}>
                  {validationError}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={applyCustomFilter}
                disabled={!customStartDate || !customEndDate}
              >
                Apply Custom Range
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>
    </LocalizationProvider>
  );
}
