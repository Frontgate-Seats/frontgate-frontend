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
import CommentIcon from "@mui/icons-material/Comment";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { updatePurchaseComment } from "../../store/slices/purchases.slice";
import type { LlmResultComment } from "../../shared/types/trade.types";

type Feedback = "good" | "bad";

interface PurchaseCommentCellProps {
  /** inventory row primary key (uuid) */
  purchaseRowId: string;
  comment: LlmResultComment | null | undefined;
}

/** Pull the human text out of the { human_comment, ai_comment } shape. */
function extractHumanText(comment: LlmResultComment | null | undefined): string {
  const hc = comment?.human_comment;
  if (!hc) return "";
  if (typeof hc.text === "string") return hc.text;
  if (typeof hc.comment === "string") return hc.comment;
  return "";
}

function extractFeedback(
  comment: LlmResultComment | null | undefined,
): Feedback | null {
  const fb = comment?.human_comment?.feedback as Feedback | undefined;
  return fb ?? null;
}

/**
 * Compact comment/feedback control for a purchase row: a single icon button
 * (highlighted when feedback/comment exist) that opens a popup with thumbs
 * up/down rating and an editable comment — mirroring the trade page.
 *
 * Persists to inventory.llm_result_comment using the same
 * { human_comment: { text, feedback }, ai_comment } shape as the trade page,
 * so the repricing/learning AI consumes purchase feedback identically.
 */
export default function PurchaseCommentCell({
  purchaseRowId,
  comment,
}: PurchaseCommentCellProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [feedbackSaving, setFeedbackSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const humanText = extractHumanText(comment);
  const currentFeedback = extractFeedback(comment);
  const hasContent = Boolean(humanText) || currentFeedback !== null;
  const open = Boolean(anchorEl);

  const persist = React.useCallback(
    (updated: LlmResultComment) =>
      dispatch(updatePurchaseComment({ purchaseRowId, comment: updated })).unwrap(),
    [dispatch, purchaseRowId],
  );

  const handleToggle = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (open) {
      setAnchorEl(null);
      setEditing(false);
    } else {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleEdit = () => {
    setDraft(humanText);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(humanText);
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    const updated: LlmResultComment = {
      ai_comment: comment?.ai_comment ?? {},
      human_comment: {
        ...(comment?.human_comment ?? {}),
        text: trimmed || undefined,
      },
    };

    setSaving(true);
    try {
      await persist(updated);
      setEditing(false);
    } catch {
      // Snackbar error is handled in the thunk.
    } finally {
      setSaving(false);
    }
  };

  const handleFeedback = async (feedback: Feedback) => {
    // Toggle off if clicking the same feedback again.
    const newFeedback = currentFeedback === feedback ? null : feedback;
    const updated: LlmResultComment = {
      ai_comment: comment?.ai_comment ?? {},
      human_comment: {
        ...(comment?.human_comment ?? {}),
        feedback: newFeedback || undefined,
      },
    };

    setFeedbackSaving(true);
    try {
      await persist(updated);
    } catch {
      // Snackbar error is handled in the thunk.
    } finally {
      setFeedbackSaving(false);
    }
  };

  return (
    <Box sx={{ display: "inline-flex" }}>
      <Tooltip title={hasContent ? "View feedback & comment" : "Add feedback & comment"}>
        <IconButton
          size="small"
          onClick={handleToggle}
          color={open || hasContent ? "primary" : "default"}
          aria-label="Purchase feedback and comment"
        >
          {hasContent ? (
            <CommentIcon sx={{ fontSize: 18 }} />
          ) : (
            <CommentOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
        modifiers={[
          { name: "offset", options: { offset: [0, 8] } },
          { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
        ]}
      >
        <ClickAwayListener
          onClickAway={() => {
            if (!editing) {
              setAnchorEl(null);
            }
          }}
        >
            <Paper elevation={8} sx={{ width: 380, maxHeight: 420, overflow: "auto" }}>
              <Box sx={{ p: 2 }} onKeyDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                {/* ── Header: title + thumbs + edit ───────────────────── */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={0.75}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <CommentOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      Feedback &amp; Comment
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Tooltip
                      title={currentFeedback === "good" ? "Remove good rating" : "Mark as good"}
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleFeedback("good")}
                          disabled={feedbackSaving}
                          color={currentFeedback === "good" ? "success" : "default"}
                          aria-label="Mark purchase feedback as good"
                        >
                          {currentFeedback === "good" ? (
                            <ThumbUpIcon fontSize="small" />
                          ) : (
                            <ThumbUpOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={currentFeedback === "bad" ? "Remove bad rating" : "Mark as bad"}
                    >
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleFeedback("bad")}
                          disabled={feedbackSaving}
                          color={currentFeedback === "bad" ? "error" : "default"}
                          aria-label="Mark purchase feedback as bad"
                        >
                          {currentFeedback === "bad" ? (
                            <ThumbDownIcon fontSize="small" />
                          ) : (
                            <ThumbDownOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    {!editing && (
                      <Tooltip title={humanText ? "Edit comment" : "Add comment"}>
                        <IconButton
                          size="small"
                          onClick={handleEdit}
                          aria-label="Edit comment"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>

                {/* ── Body ────────────────────────────────────────────── */}
                {editing ? (
                  <Stack spacing={1}>
                    <TextField
                      multiline
                      minRows={3}
                      maxRows={8}
                      fullWidth
                      size="small"
                      label="Your comment"
                      placeholder="Add your feedback or notes for the AI…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      disabled={saving}
                      autoFocus
                      slotProps={{ htmlInput: { "aria-label": "Purchase comment" } }}
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
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}
                  >
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
            </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
