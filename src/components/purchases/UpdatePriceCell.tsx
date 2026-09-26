import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputAdornment,
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
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { updateInventoryPrice } from "../../store/slices/purchases.slice";

interface UpdatePriceCellProps {
  /** inventory table primary key (uuid) — used to patch local Redux state */
  rowId: string;
  /** SkyBox numeric inventory ID — sent to the API */
  inventoryId: number | string | null | undefined;
  /** Current list price from the row */
  currentPrice: number | null | undefined;
  /** Event UTC date — edit only allowed for future events */
  eventUtcDate: string | null | undefined;
  /** Inventory status — edit only allowed when not DEPLETED */
  inventoryStatus: string | null | undefined;
}

/**
 * Compact inline price-edit control for a purchases grid row.
 *
 * Displays the current list price and a small icon button. Clicking the button
 * opens a Popper with a numeric input pre-filled with the current price. On
 * save the new price is sent to PUT /events-api/inventory/:inventoryId/price
 * and the local Redux row is patched immediately (no full refetch needed).
 *
 * Only renders the edit button when the row has a valid numeric inventory_id —
 * rows without one are orders still being confirmed by SkyBox and cannot be
 * price-updated yet.
 */
export default function UpdatePriceCell({
  rowId,
  inventoryId,
  currentPrice,
  eventUtcDate,
  inventoryStatus,
}: UpdatePriceCellProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [inputError, setInputError] = React.useState("");

  const open = Boolean(anchorEl);
  const numericInventoryId = inventoryId != null ? Number(inventoryId) : null;
  const isFutureEvent = eventUtcDate ? new Date(eventUtcDate).getTime() > Date.now() : false;
  const isNotSold = inventoryStatus !== "DEPLETED";
  const canEdit =
    numericInventoryId != null &&
    !isNaN(numericInventoryId) &&
    numericInventoryId > 0 &&
    isFutureEvent &&
    isNotSold;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setDraft(currentPrice != null ? String(currentPrice) : "");
    setInputError("");
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setInputError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    setInputError("");
  };

  const handleSave = async () => {
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed <= 0) {
      setInputError("Enter a valid price greater than 0");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateInventoryPrice({
          inventoryId: numericInventoryId!,
          listPrice: parsed,
          rowId,
        }),
      ).unwrap();
      handleClose();
    } catch {
      // Snackbar error is already dispatched by the thunk.
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
      {/* Current price display */}
      <Typography
        variant="body2"
        fontWeight={600}
        color="text.primary"
        sx={{ minWidth: 52, textAlign: "right" }}
      >
        {currentPrice != null ? `$${currentPrice.toFixed(2)}` : "—"}
      </Typography>

      {/* Edit button — only for future unsold inventory */}
      {canEdit && (
        <Tooltip title="Update list price in SkyBox">
          <IconButton
            size="medium"
            onClick={handleOpen}
            color={open ? "primary" : "default"}
            aria-label="Update list price"
            sx={{ p: 0.1 }}
          >
            <EditOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
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
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{ p: 2, width: 240 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Update List Price
              </Typography>

              <TextField
                autoFocus
                size="small"
                label="New price"
                type="number"
                value={draft}
                onChange={handleChange}
                disabled={saving}
                error={Boolean(inputError)}
                helperText={inputError || " "}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0.01, step: 0.01, "aria-label": "New list price" },
                  },
                }}
                fullWidth
              />

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
