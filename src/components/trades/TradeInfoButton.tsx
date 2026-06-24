import * as React from "react";
import {
  Box,
  Divider,
  Fade,
  IconButton,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

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

// ── TradeInfoButton: popper with reasoning + feedback ─────────────────────────
export default function TradeInfoButton({ trade }: { trade: Trade }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [pinned, setPinned] = React.useState(false);
  const reason = extractReason(trade.llm_result, trade.listing_id);
  const open = Boolean(anchorEl);

  const handleHoverOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (!pinned) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleHoverClose = () => {
    if (!pinned) {
      setAnchorEl(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (pinned) {
      // Unpin and close
      setPinned(false);
      setAnchorEl(null);
    } else {
      // Pin open
      setPinned(true);
      setAnchorEl(e.currentTarget);
    }
  };

  return (
    <Box
      onMouseEnter={handleHoverOpen}
      onMouseLeave={handleHoverClose}
      sx={{ display: "inline-flex" }}
    >
      <IconButton
        size="small"
        onClick={handleClick}
        color={open ? "primary" : "default"}
        aria-label="View reasoning and feedback"
        sx={{
          transition: "all 0.2s",
          ...(pinned && {
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.dark" },
          }),
        }}
      >
        <TipsAndUpdatesOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="top"
        transition
        style={{ zIndex: 1300 }}
        modifiers={[
          { name: "offset", options: { offset: [0, 8] } },
          { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              elevation={8}
              sx={{ width: 480, maxHeight: 520, overflow: "auto" }}
              onMouseEnter={() => { if (!pinned) setAnchorEl(anchorEl); }}
              onMouseLeave={() => { if (!pinned) setAnchorEl(null); }}
            >
              <Box sx={{ p: 2 }} onKeyDown={(e) => e.stopPropagation()}>
                <Stack spacing={2}>
                  {/* Reason to Buy */}
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.75} mb={0.75}>
                      <TipsAndUpdatesOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
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
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}
