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
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
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
  // Only look for text/comment fields, ignore feedback
  if (typeof hc.text === "string") return hc.text;
  if (typeof hc.comment === "string") return hc.comment;
  // Don't pick up feedback or other fields
  return "";
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
  const existingFeedback = existingComment?.human_comment?.feedback as "good" | "bad" | undefined;

  // Feedback state
  const [feedbackSaving, setFeedbackSaving] = React.useState(false);
  const [currentFeedback, setCurrentFeedback] = React.useState<"good" | "bad" | null>(existingFeedback ?? null);

  // Sync draft when trade data changes (e.g. after a save patches Redux state)
  React.useEffect(() => {
    if (!editing) {
      setDraftText(extractHumanText(trade.llm_result_comment));
    }
    const feedback = trade.llm_result_comment?.human_comment?.feedback as "good" | "bad" | undefined;
    setCurrentFeedback(feedback ?? null);
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
      human_comment: {
        ...(existingComment?.human_comment ?? {}),
        text: trimmed || undefined,
      },
    };
    setSaving(true);
    try {
      await dispatch(updateTradeComment({ tradeId: trade.id, comment: updatedComment })).unwrap();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFeedback = async (feedback: "good" | "bad") => {
    // Toggle off if clicking the same feedback
    const newFeedback = currentFeedback === feedback ? null : feedback;
    
    setFeedbackSaving(true);
    try {
      const updatedComment: LlmResultComment = {
        ai_comment: existingComment?.ai_comment ?? {},
        human_comment: {
          ...(existingComment?.human_comment ?? {}),
          feedback: newFeedback || undefined,
        },
      };
      
      await dispatch(updateTradeComment({ tradeId: trade.id, comment: updatedComment })).unwrap();
      setCurrentFeedback(newFeedback);
    } catch (error) {
      console.error("Failed to save feedback:", error);
    } finally {
      setFeedbackSaving(false);
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

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {/* Thumbs up/down feedback */}
          <Tooltip title={currentFeedback === "good" ? "Remove good rating" : "Mark as good trade"}>
            <span>
              <IconButton
                size="small"
                onClick={() => handleFeedback("good")}
                disabled={feedbackSaving}
                color={currentFeedback === "good" ? "success" : "default"}
                sx={{ opacity: feedbackSaving ? 0.5 : 1 }}
              >
                {currentFeedback === "good" ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={currentFeedback === "bad" ? "Remove bad rating" : "Mark as bad trade"}>
            <span>
              <IconButton
                size="small"
                onClick={() => handleFeedback("bad")}
                disabled={feedbackSaving}
                color={currentFeedback === "bad" ? "error" : "default"}
                sx={{ opacity: feedbackSaving ? 0.5 : 1 }}
              >
                {currentFeedback === "bad" ? <ThumbDownIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>

          {!editing && (
            <Tooltip title={humanText ? "Edit your comment" : "Add a comment"}>
              <IconButton size="small" onClick={handleEdit} aria-label="Edit comment">
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
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
