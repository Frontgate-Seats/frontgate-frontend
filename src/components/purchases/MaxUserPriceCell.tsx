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
import { updateMaxUserPrice } from "../../store/slices/purchases.slice";

interface MaxUserPriceCellProps {
  /** inventory table primary key (uuid) — used to update and patch local Redux state */
  rowId: string;
  /** Current max user price from the row (nullable) */
  currentPrice: number | null | undefined;
  /** Inventory status — editing is disabled once the item is sold (DEPLETED) */
  inventoryStatus: string | null | undefined;
}

/**
 * Compact inline editor for the operator-set max user price on a purchases row.
 *
 * Mirrors UpdatePriceCell's UX, but this is a local-only field: it writes
 * straight to inventory.max_user_price in Supabase (no SkyBox call) and patches
 * the local Redux row on success. The field is nullable, so clearing the input
 * and saving stores NULL.
 */
export default function MaxUserPriceCell({
  rowId,
  currentPrice,
  inventoryStatus,
}: MaxUserPriceCellProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [inputError, setInputError] = React.useState("");

  const open = Boolean(anchorEl);
  // Sold items are final — no editing the max user price once DEPLETED.
  const canEdit = inventoryStatus !== "DEPLETED";

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
    const trimmed = draft.trim();
    // Empty input clears the value (stores NULL).
    let value: number | null = null;
    if (trimmed !== "") {
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed) || parsed < 0) {
        setInputError("Enter a valid price (0 or more), or leave blank to clear");
        return;
      }
      value = parsed;
    }

    setSaving(true);
    try {
      await dispatch(
        updateMaxUserPrice({ rowId, maxUserPrice: value }),
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
      {/* Current value display */}
      <Typography
        variant="body2"
        fontWeight={600}
        color={currentPrice != null ? "text.primary" : "text.disabled"}
        sx={{ minWidth: 52, textAlign: "right" }}
      >
        {currentPrice != null ? `$${currentPrice.toFixed(2)}` : "—"}
      </Typography>

      {canEdit && (
        <Tooltip title="Set max user price">
          <IconButton
            size="medium"
            onClick={handleOpen}
            color={open ? "primary" : "default"}
            aria-label="Set max user price"
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
                Set Max User Price
              </Typography>

              <TextField
                autoFocus
                size="small"
                label="Max price (blank to clear)"
                type="number"
                value={draft}
                onChange={handleChange}
                disabled={saving}
                error={Boolean(inputError)}
                helperText={inputError || " "}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    inputProps: { min: 0, step: 0.01, "aria-label": "Max user price" },
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
