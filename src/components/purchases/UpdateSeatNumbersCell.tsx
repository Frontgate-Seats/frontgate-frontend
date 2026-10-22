import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  Paper,
  Popper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import eventsApi from "../../apis/events.api";

interface UpdateSeatNumbersCellProps {
  purchaseId: string;
  lowSeat: number | null;
  highSeat: number | null;
  quantity: number;
  soldQuantity: number;
  onUpdate?: () => void;
}

/**
 * Compact inline seat-number-edit control for a purchases grid row.
 *
 * Displays the current seat numbers (e.g., "5-8") and a small icon button.
 * Clicking the button opens a Popper with a single numeric input for the low seat.
 * The high seat is automatically calculated based on available quantity (quantity - soldQuantity).
 * On save, the new low seat value is sent to the API and the parent can refresh the data.
 */
export default function UpdateSeatNumbersCell({
  purchaseId,
  lowSeat,
  highSeat,
  quantity,
  soldQuantity,
  onUpdate,
}: UpdateSeatNumbersCellProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draftLowSeat, setDraftLowSeat] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [inputError, setInputError] = React.useState("");

  const open = Boolean(anchorEl);

  const formatSeatNumbers = (low: number | null, high: number | null): string => {
    if (!low || !high) return "—";
    if (low === high) return String(low);
    return `${low}-${high}`;
  };

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setDraftLowSeat(lowSeat?.toString() || "");
    setInputError("");
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setInputError("");
  };

  const handleSave = async () => {
    const low = parseInt(draftLowSeat, 10);

    // Validation
    if (!draftLowSeat) {
      setInputError("Low seat number is required");
      return;
    }

    if (isNaN(low)) {
      setInputError("Low seat must be a valid number");
      return;
    }

    if (low <= 0) {
      setInputError("Low seat must be positive");
      return;
    }

    setSaving(true);
    setInputError("");

    try {
      await eventsApi.updateInventorySeatNumbers(purchaseId, low);
      handleClose();
      onUpdate?.();
    } catch (err: any) {
      setInputError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleClose();
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5, width: "100%" }}>
      {/* Current seat numbers display */}
      <Typography
        variant="body2"
        fontWeight={600}
        color="text.primary"
        sx={{ minWidth: 52, textAlign: "right", fontFamily: "monospace" }}
      >
        {formatSeatNumbers(lowSeat, highSeat)}
      </Typography>

      {/* Edit button */}
      <Tooltip title="Update seat numbers">
        <IconButton
          size="medium"
          onClick={handleOpen}
          color={open ? "primary" : "default"}
          aria-label="Update seat numbers"
          sx={{ p: 0.1 }}
        >
          <EditOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
        modifiers={[
          { name: "offset", options: { offset: [0, 6] } },
          { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{ p: 2, width: 280 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Update Seat Numbers
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Available quantity: {quantity - soldQuantity} seat(s)
                <br />
                High seat will be auto-calculated
              </Typography>

              <TextField
                autoFocus
                size="small"
                label="Low seat"
                type="number"
                value={draftLowSeat}
                onChange={(e) => {
                  setDraftLowSeat(e.target.value);
                  setInputError("");
                }}
                disabled={saving}
                slotProps={{
                  input: {
                    inputProps: { min: 1, "aria-label": "Low seat number" },
                  },
                }}
                fullWidth
                helperText={draftLowSeat && !isNaN(parseInt(draftLowSeat, 10)) 
                  ? `High seat will be: ${parseInt(draftLowSeat, 10) + (quantity - soldQuantity) - 1}`
                  : " "
                }
              />

              {inputError && (
                <Typography variant="caption" color="error">
                  {inputError}
                </Typography>
              )}

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<CancelOutlinedIcon />}
                  onClick={handleClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <SaveOutlinedIcon />
                    )
                  }
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
