import * as React from "react";
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import type { Trade } from "../../shared/types/trade.types";
import TradeCommentSection from "./TradeCommentSection";

// ── Helper: extract reasoning from llm_result ─────────────────────────────────
function extractReason(
  llmResult: Record<string, unknown> | null | undefined,
  listingId: string | null,
): string | null {
  if (!llmResult) return null;

  const recs = (llmResult.recommendations ?? []) as Array<Record<string, unknown>>;
  const match = recs.find((r) => r.target_listing_id === listingId);

  if (typeof match?.reasoning === "string" && match.reasoning.trim()) {
    return match.reasoning.trim();
  }

  const eventAssessment = llmResult.event_assessment as Record<string, unknown> | undefined;
  if (typeof eventAssessment?.reasoning === "string" && eventAssessment.reasoning.trim()) {
    return eventAssessment.reasoning.trim();
  }

  if (recs.length > 0 && typeof recs[0].reasoning === "string" && recs[0].reasoning.trim()) {
    return recs[0].reasoning.trim();
  }

  return null;
}

// ── TradeInfoButton: popover with reasoning + feedback ────────────────────────
export default function TradeInfoButton({ trade }: { trade: Trade }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const reason = extractReason(trade.llm_result, trade.listing_id);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      sx={{ display: "inline-flex" }}
    >
      <IconButton
        size="small"
        color={open ? "primary" : "default"}
        aria-label="View reasoning and feedback"
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: { width: 480, maxHeight: 520, overflow: "auto", pointerEvents: "auto" },
            onMouseEnter: () => setAnchorEl(anchorEl),
            onMouseLeave: handleClose,
          },
        }}
        disableRestoreFocus
        sx={{ pointerEvents: "none" }}
      >
        <Box sx={{ p: 2, pointerEvents: "auto" }} onKeyDown={(e) => e.stopPropagation()}>
          <Stack spacing={2}>
            {/* Reason to Buy */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
                <InfoOutlinedIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700} color="primary">
                  Reason to Buy
                </Typography>
              </Stack>
              {reason ? (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {reason}
                  </Typography>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.disabled" fontStyle="italic">
                  No reasoning available.
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Feedback & Comments */}
            <TradeCommentSection trade={trade} />
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
}
