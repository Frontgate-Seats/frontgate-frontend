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
import { getErrorMessage } from "../../shared/utils/error.util";

interface UpdateRowCellProps {
  /** SkyBox numeric purchase ID (inventory.purchase_id) — sent to the API */
  purchaseId: number | string | null | undefined;
  /** Current row from the grid row */
  row: string | null | undefined;
  /** Fulfillment status — edit blocked once fulfillment is COMPLETE (a sold line is still editable while fulfillment is pending) */
  fulfillmentStatus?: string | null;
  /** Called after a successful update so the parent can refresh the grid */
  onUpdate?: () => void;
}

/**
 * Compact inline "Update row" control for an inventory grid row.
 *
 * Shows the current row and an edit icon. Saving sends only the new row to
 * PUT /events-api/purchases/:purchaseId/lines/replace-line, which cancels the
 * SkyBox line and recreates it (lines/replace). Section and seats are left
 * untouched; seats are edited separately by UpdateSeatsCell.
 */
export default function UpdateRowCell({
  purchaseId,
  row,
  fulfillmentStatus,
  onUpdate,
}: UpdateRowCellProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [draftRow, setDraftRow] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [inputError, setInputError] = React.useState("");

  const open = Boolean(anchorEl);
  const numericPurchaseId = purchaseId != null ? Number(purchaseId) : null;
  const hasPurchaseId =
    numericPurchaseId != null &&
    !isNaN(numericPurchaseId) &&
    numericPurchaseId > 0;

  const canEdit =
    hasPurchaseId &&
    fulfillmentStatus !== "COMPLETE";

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setDraftRow(row?.toString() ?? "");
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

    const nextRow = draftRow.trim();
    if (!nextRow) {
      setInputError("Row is required");
      return;
    }
    if (nextRow === (row ?? "").trim()) {
      handleClose();
      return;
    }

    setSaving(true);
    setInputError("");
    try {
      await eventsApi.replaceInventoryLine({
        purchaseId: numericPurchaseId as number,
        row: nextRow,
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
        color="text.primary"
        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {row?.trim() || "—"}
      </Typography>

      {canEdit ? (
        <Tooltip title="Update row">
          <IconButton
            size="medium"
            onClick={handleOpen}
            color={open ? "primary" : "default"}
            aria-label="Update row"
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
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{ p: 2, width: 280 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Update Row
              </Typography>

              <Typography variant="body2" color="text.secondary">
                This cancels the current SkyBox line and recreates it with the
                new row.
              </Typography>

              <TextField
                autoFocus
                size="small"
                label="Row"
                value={draftRow}
                onChange={(e) => {
                  setDraftRow(e.target.value);
                  setInputError("");
                }}
                disabled={saving}
                fullWidth
                slotProps={{ htmlInput: { "aria-label": "Row" } }}
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
