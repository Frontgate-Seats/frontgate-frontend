import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import eventsApi from "../../apis/events.api";
import { getErrorMessage } from "../../shared/utils/error.util";
import { isFutureUtcDate } from "../../shared/utils/dateTime.util";
import type { SeatType } from "../../apis/purchases.api";

interface UpdateSeatsCellProps {
  /** SkyBox numeric purchase ID (inventory.purchase_id) — sent to the API */
  purchaseId: number | string | null | undefined;
  /** Current low seat from the grid row */
  lowSeat?: number | null;
  /** Current high seat from the grid row (display only) */
  highSeat?: number | null;
  /** Current seat type from the grid row */
  seatType?: string | null;
  /** Event date — edit only allowed for future events */
  eventUtcDate?: string | null;
  /** Fulfillment status — edit blocked once fulfillment is COMPLETE (a sold line is still editable while fulfillment is pending) */
  fulfillmentStatus?: string | null;
  /** Called after a successful update so the parent can refresh the grid */
  onUpdate?: () => void;
}

const SEAT_TYPES: { value: SeatType; label: string; hint: string }[] = [
  { value: "CONSECUTIVE", label: "Consecutive", hint: "Sequential seats (1, 2, 3, 4)" },
  { value: "ALTERNATING", label: "Alternating", hint: "Every other seat (1, 3, 5, 7)" },
  { value: "GA", label: "General Admission", hint: "No specific seat numbers" },
  { value: "PIGGYBACK", label: "Piggyback", hint: "Non-consecutive (1, 5, 8, 12)" },
];

/**
 * Compact inline "Update seats" control for an inventory grid row.
 *
 * Shows the current seats (e.g. "5-8") and an edit icon. Saving sends the new
 * low seat and seat type to
 * PUT /events-api/purchases/:purchaseId/lines/replace-line, which cancels the
 * SkyBox line and recreates it (lines/replace). The high seat is derived by
 * SkyBox from low seat + quantity. Row is edited separately by UpdateRowCell.
 */
export default function UpdateSeatsCell({
  purchaseId,
  lowSeat,
  highSeat,
  seatType,
  eventUtcDate,
  fulfillmentStatus,
  onUpdate,
}: UpdateSeatsCellProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draftLowSeat, setDraftLowSeat] = React.useState("");
  const [draftSeatType, setDraftSeatType] = React.useState<SeatType>("CONSECUTIVE");
  const [saving, setSaving] = React.useState(false);
  const [inputError, setInputError] = React.useState("");
  const [selectOpen, setSelectOpen] = React.useState(false);

  const open = Boolean(anchorEl);
  const numericPurchaseId = purchaseId != null ? Number(purchaseId) : null;
  const hasPurchaseId =
    numericPurchaseId != null &&
    !isNaN(numericPurchaseId) &&
    numericPurchaseId > 0;

  // event_utc_date is always read as UTC, never browser-local time.
  const isFutureEvent = isFutureUtcDate(eventUtcDate);

  const canEdit =
    hasPurchaseId &&
    isFutureEvent &&
    fulfillmentStatus !== "COMPLETE";

  const label =
    lowSeat == null
      ? "—"
      : highSeat == null || lowSeat === highSeat
        ? String(lowSeat)
        : `${lowSeat}-${highSeat}`;

  const currentSeatType: SeatType = SEAT_TYPES.some((t) => t.value === seatType)
    ? (seatType as SeatType)
    : "CONSECUTIVE";

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setDraftLowSeat(lowSeat != null ? String(lowSeat) : "");
    setDraftSeatType(currentSeatType);
    setInputError("");
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setInputError("");
  };

  const handleSave = async () => {
    if (!hasPurchaseId) {
      setInputError("This row has no SkyBox purchase to update yet");
      return;
    }

    const low = parseInt(draftLowSeat.trim(), 10);
    if (isNaN(low) || low <= 0) {
      setInputError("Low seat must be a positive number");
      return;
    }
    if (low === (lowSeat ?? null) && draftSeatType === currentSeatType) {
      handleClose();
      return;
    }

    setSaving(true);
    setInputError("");
    try {
      await eventsApi.replaceInventoryLine({
        purchaseId: numericPurchaseId as number,
        lowSeat: low,
        seatType: draftSeatType,
      });
      handleClose();
      onUpdate?.();
    } catch (err: unknown) {
      setInputError(getErrorMessage(err) || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleClose();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        width: "100%",
      }}
    >
      <Typography
        variant="body2"
        fontWeight={600}
        color="text.primary"
        sx={{ fontFamily: "monospace" }}
      >
        {label}
      </Typography>

      {canEdit ? (
        <Tooltip title="Update seats">
          <IconButton
            size="medium"
            onClick={handleOpen}
            color={open ? "primary" : "default"}
            aria-label="Update seats"
            sx={{ p: 0.1 }}
          >
            <EditOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      ) : (
        // Reserve the icon slot so values line up across editable/locked rows.
        <Box sx={{ width: 22, flexShrink: 0 }} aria-hidden />
      )}

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
        <ClickAwayListener
          onClickAway={() => {
            if (selectOpen) return;
            handleClose();
          }}
        >
          <Paper
            elevation={8}
            sx={{ p: 2, width: 300 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Update Seats
              </Typography>

              <Typography variant="body2" color="text.secondary">
                This cancels the current SkyBox line and recreates it with the
                new seats.
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
                fullWidth
                slotProps={{ htmlInput: { min: 1, "aria-label": "Low seat" } }}
              />

              <FormControl size="small" fullWidth disabled={saving}>
                <InputLabel id="update-seats-seat-type">Seat Type</InputLabel>
                <Select
                  labelId="update-seats-seat-type"
                  value={draftSeatType}
                  label="Seat Type"
                  onChange={(e) => setDraftSeatType(e.target.value as SeatType)}
                  onOpen={() => setSelectOpen(true)}
                  onClose={() => setSelectOpen(false)}
                >
                  {SEAT_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {t.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.hint}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
