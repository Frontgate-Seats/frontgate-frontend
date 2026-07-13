import React from "react";
import {
  TextField,
  MenuItem,
  Stack,
  Slider,
  Box,
  Typography,
  Popover,
  Select,
  Checkbox,
  ListItemText,
  FormControl,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import type {
  GridSingleSelectColDef,
  GridValueOptionsParams,
} from "@mui/x-data-grid";
import type { CustomGridColDef } from "../../../../shared/types/mui.type";

interface FilterInputProps {
  column: CustomGridColDef;
  value: any;
  onChange: (value: any) => void;
  onCommit?: (value: any) => void;
  size?: "small" | "medium";
  variant?: "outlined" | "filled" | "standard";
  fullWidth?: boolean;
  placeholder?: string;
  compact?: boolean; // New prop for header-friendly compact mode
}

const normalizeOption = (opt: unknown): { value: string; label: string } => {
  if (opt == null) return { value: "", label: "" };
  if (typeof opt === "string" || typeof opt === "number")
    return { value: String(opt), label: String(opt) };
  if (typeof opt === "object") {
    const o = opt as { value?: string | number; label?: string };
    return {
      value: String(o.value ?? ""),
      label: o.label ?? String(o.value ?? ""),
    };
  }
  return { value: String(opt), label: String(opt) };
};

const formatDateRange = (value: any): string => {
  if (!value || !Array.isArray(value)) return "Select dates";
  const [start, end] = value;
  const startStr = start ? moment(start).format("MMM DD") : "";
  const endStr = end ? moment(end).format("MMM DD") : "";
  if (startStr && endStr) return `${startStr} - ${endStr}`;
  if (startStr) return `From ${startStr}`;
  if (endStr) return `To ${endStr}`;
  return "Select dates";
};

const formatNumberRange = (value: any, min: number, max: number): string => {
  if (!value || !Array.isArray(value)) return `${min} - ${max}`;
  const [start, end] = value;
  return `${start ?? min} - ${end ?? max}`;
};

const safeMoment = (v: any): moment.Moment | null => {
  if (v == null || v === "") return null;
  const m = moment(v);
  return m.isValid() ? m : null;
};

// Standard input height for consistency
const STANDARD_INPUT_HEIGHT = 40;
// Compact input height to match compact text/select fields
const COMPACT_INPUT_HEIGHT = 28;

// Compact Date Range Component
const CompactDateRange = ({
  value,
  onChange,
  size,
  variant,
  compact,
}: {
  value: any;
  onChange: (value: any) => void;
  size: "small" | "medium";
  variant: "outlined" | "filled" | "standard";
  compact?: boolean;
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent sorting when clicking on date range
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const inputHeight = compact ? COMPACT_INPUT_HEIGHT : STANDARD_INPUT_HEIGHT;

  return (
    <>
      <TextField
        size={size}
        fullWidth
        variant={variant}
        value={formatDateRange(value)}
        onClick={handleClick}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: <CalendarTodayIcon sx={{ fontSize: compact ? 14 : 18 }} />,
          },
        }}
        sx={{ 
          cursor: "pointer",
          "& .MuiOutlinedInput-root": {
            height: inputHeight,
            ...(compact && { fontSize: "0.75rem" }),
          },
          ...(compact && {
            "& .MuiOutlinedInput-input": {
              padding: "3px 6px",
            },
          }),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1.5, minWidth: 320 }}>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1}>
                <DatePicker
                  label="From"
                  value={value?.[0] ? safeMoment(value?.[0]) : null}
                  onChange={(v) =>
                    onChange([v ? v.toISOString() : null, value?.[1]])
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      variant: "outlined",
                    },
                  }}
                />
                <DatePicker
                  label="To"
                  value={safeMoment(value?.[1])}
                  onChange={(v) =>
                    onChange([value?.[0], v ? v.toISOString() : null])
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      variant: "outlined",
                    },
                  }}
                />
              </Stack>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Popover>
    </>
  );
};

// Compact Number Range Component
const CompactNumberRange = ({
  value,
  onChange,
  onCommit,
  column,
  size,
  variant,
  compact,
}: {
  value: any;
  onChange: (value: any) => void;
  onCommit?: (value: any) => void;
  column: CustomGridColDef;
  size: "small" | "medium";
  variant: "outlined" | "filled" | "standard";
  compact?: boolean;
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const min = column.min as number;
  const max = column.max as number;
  
  // Normalize value to always have both start and end
  const normalizedValue = value ?? [min, max];
  const startValue = normalizedValue[0] ?? min;
  const endValue = normalizedValue[1] ?? max;
  const areEqual = startValue === endValue;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent sorting when clicking on number range
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const inputHeight = compact ? COMPACT_INPUT_HEIGHT : STANDARD_INPUT_HEIGHT;

  return (
    <>
      <TextField
        size={size}
        fullWidth
        variant={variant}
        value={formatNumberRange(value, min, max)}
        onClick={handleClick}
        sx={{ 
          cursor: "pointer",
          "& .MuiOutlinedInput-root": {
            height: inputHeight,
            ...(compact && { fontSize: "0.75rem" }),
          },
          ...(compact && {
            "& .MuiOutlinedInput-input": {
              padding: "3px 6px",
            },
          }),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1.5, minWidth: 280 }}>
          <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
            Range: {min} - {max}
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="number"
                value={startValue}
                onChange={(e) =>
                  onChange([Number(e.target.value), endValue])
                }
                sx={{ width: 70 }}
                variant="outlined"
              />
              <Slider
                value={[startValue, endValue]}
                onChange={(_, newVal) => {
                  if (Array.isArray(newVal)) {
                    onChange(newVal);
                  }
                }}
                onChangeCommitted={(_, newVal) => {
                  if (Array.isArray(newVal) && onCommit) {
                    onCommit(newVal);
                  }
                }}
                min={min}
                max={max}
                step={1}
                valueLabelDisplay="auto"
                sx={{ 
                  flex: 1,
                  // Style the thumb handles with different colors
                  '& .MuiSlider-thumb': {
                    '&:nth-of-type(1)': {
                      backgroundColor: 'primary.main',
                      border: '2px solid',
                      borderColor: 'primary.dark',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                      },
                    },
                    '&:nth-of-type(2)': {
                      backgroundColor: 'secondary.main',
                      border: '2px solid',
                      borderColor: 'secondary.dark',
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(220, 0, 78, 0.16)',
                      },
                    },
                  },
                  // Slightly offset thumbs when they overlap
                  '& .MuiSlider-thumb:nth-of-type(1)': {
                    zIndex: areEqual ? 2 : 1,
                    transform: areEqual 
                      ? 'translate(-50%, -50%) translateX(-2px)' 
                      : 'translate(-50%, -50%)',
                  },
                  '& .MuiSlider-thumb:nth-of-type(2)': {
                    zIndex: areEqual ? 1 : 1,
                    transform: areEqual 
                      ? 'translate(-50%, -50%) translateX(2px)' 
                      : 'translate(-50%, -50%)',
                  },
                }}
              />
              <TextField
                size="small"
                type="number"
                value={endValue}
                onChange={(e) =>
                  onChange([startValue, Number(e.target.value)])
                }
                sx={{ width: 70 }}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

export default function FilterInput({
  column,
  value,
  onChange,
  onCommit,
  size = "small",
  variant = "outlined",
  fullWidth = true,
  placeholder,
  compact = false,
}: FilterInputProps) {
  // Prevent event propagation to avoid triggering parent click handlers (like sorting)
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleFocus = (event: React.FocusEvent) => {
    event.stopPropagation();
  };

  const commonProps = {
    onClick: handleClick,
    onFocus: handleFocus,
  };

  // Standard styling for consistent height across all input types
  const standardInputSx = {
    "& .MuiOutlinedInput-root": {
      height: STANDARD_INPUT_HEIGHT,
    },
  };

  // Compact styling for all text fields
  const compactTextFieldSx = compact
    ? ({
        "& .MuiOutlinedInput-root": {
          minHeight: 28,
          fontSize: "0.75rem",
        },
        "& .MuiOutlinedInput-input": {
          padding: "3px 6px",
        },
        "& .MuiInputLabel-root": {
          fontSize: "0.75rem",
        },
        "& .MuiSelect-select": {
          padding: "3px 6px",
        },
      } as const)
    : standardInputSx;

  switch (column.type) {
    case "number":
      // Check if it's a range slider (has min/max defined)
      if (typeof column.min === "number" && typeof column.max === "number") {
        // Always use compact for ranges
        return (
          <CompactNumberRange
            value={value}
            onChange={onChange}
            onCommit={onCommit}
            column={column}
            size={size}
            variant={variant}
            compact={compact}
          />
        );
      } else {
        return (
          <TextField
            size={size}
            fullWidth={fullWidth}
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Enter number..."}
            variant={variant}
            sx={compactTextFieldSx}
            {...commonProps}
          />
        );
      }

    case "date":
    case "dateTime":
      // Always use compact for dates
      return (
        <CompactDateRange
          value={value}
          onChange={onChange}
          size={size}
          variant={variant}
          compact={compact}
        />
      );

    case "singleSelect":
      const options = (column as GridSingleSelectColDef).valueOptions;
      const opts =
        typeof options === "function"
          ? options({} as GridValueOptionsParams)
          : options ?? [];

      // Multi-select: value is an array of selected options
      const selectedValues: string[] = Array.isArray(value) ? value : value ? [value] : [];

      return (
        <FormControl size={size} fullWidth={fullWidth} {...commonProps}>
          <Select
            multiple
            value={selectedValues}
            onChange={(e) => {
              const val = e.target.value;
              const arr = typeof val === "string" ? val.split(",") : val;
              onChange(arr.length > 0 ? arr : "");
            }}
            displayEmpty
            renderValue={(selected: string[]) => {
              if (!selected || selected.length === 0) return "All";
              if (selected.length === opts.length) return "All";
              return selected.map((s) => {
                const o = opts.find((opt) => normalizeOption(opt).value === s);
                return o ? normalizeOption(o).label : s;
              }).join(", ");
            }}
            variant={variant as any}
            sx={{
              ...(compact ? { minHeight: 28, fontSize: "0.75rem", "& .MuiSelect-select": { padding: "3px 6px" } } : { height: STANDARD_INPUT_HEIGHT }),
              width: "100%",
            }}
          >
            {opts.map((opt, i) => {
              const { value: optValue, label } = normalizeOption(opt);
              return (
                <MenuItem key={i} value={optValue} dense>
                  <Checkbox size="small" checked={selectedValues.includes(optValue)} sx={{ p: 0.5 }} />
                  <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.8rem" }} />
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      );

    default:
      return (
        <TextField
          size={size}
          fullWidth={fullWidth}
          placeholder={placeholder || "Type to filter..."}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          variant={variant}
          sx={compactTextFieldSx}
          {...commonProps}
        />
      );
  }
}
