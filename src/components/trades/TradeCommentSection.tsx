import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { useAppDispatch } from "../../store/reducers/root.reducer";
import { updateTradeComment } from "../../store/slices/trades.slice";
import type { Trade, LlmResultComment } from "../../shared/types/trade.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeCommentSectionProps {
  trade: Trade;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractHumanText(comment: LlmResultComment | null | undefined): string {
  if (!comment?.human_comment) return "";
  const hc = comment.human_comment;
  if (typeof hc.text === "string") return hc.text;
  if (typeof hc.comment === "string") return hc.comment;
  const firstStr = Object.values(hc).find((v) => typeof v === "string");
  return typeof firstStr === "string" ? firstStr : "";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeCommentSection({ trade }: TradeCommentSectionProps) {
  const dispatch = useAppDispatch();

  // Local saving state — avoids a global Redux flag that would affect all open panels
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draftText, setDraftText] = React.useState("");

  const existingComment = trade.llm_result_comment;
  const humanText = extractHumanText(existingComment);

  // Sync draft when trade data changes (e.g. after a save patches Redux state)
  React.useEffect(() => {
    if (!editing) {
      setDraftText(extractHumanText(trade.llm_result_comment));
    }
  // Only re-sync when the stored comment changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade.llm_result_comment]);

  const handleEdit = () => {
    setDraftText(humanText);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraftText(humanText);
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmed = draftText.trim();
    const updatedComment: LlmResultComment = {
      // Preserve any existing ai_comment so we never wipe it
      ai_comment: existingComment?.ai_comment ?? {},
      human_comment: trimmed ? { text: trimmed } : {},
    };
    setSaving(true);
    try {
      await dispatch(updateTradeComment({ tradeId: trade.id, comment: updatedComment })).unwrap();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {/* ── Section header ──────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <CommentOutlinedIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Feedback &amp; Comments
          </Typography>
        </Stack>

        {!editing && (
          <Tooltip title={humanText ? "Edit your comment" : "Add a comment"}>
            <IconButton size="small" onClick={handleEdit} aria-label="Edit comment">
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {editing ? (
        <Stack spacing={1}>
          <TextField
            multiline
            minRows={3}
            maxRows={8}
            fullWidth
            size="small"
            label="Your comment"
            placeholder="Add your feedback or notes about this trade recommendation…"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={saving}
            autoFocus
            slotProps={{ htmlInput: { "aria-label": "Trade comment" } }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<CancelOutlinedIcon />}
              onClick={handleCancel}
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
      ) : humanText ? (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <PersonOutlineOutlinedIcon
              fontSize="small"
              sx={{ mt: 0.25, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap", flex: 1 }}
            >
              {humanText}
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <Typography
          variant="body2"
          color="text.disabled"
          fontStyle="italic"
          sx={{ cursor: "pointer", "&:hover": { color: "text.secondary" } }}
          onClick={handleEdit}
        >
          No comment yet — click to add one.
        </Typography>
      )}
    </Box>
  );
}
