import {
  TextField,
  Stack,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import CustomDialog from "../CustomDialog";
import { formatDateTime } from "../../../shared/utils/dateTime.util";
import { useMemo } from "react";

export interface SuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  suggestion: any;
  comment: string;
  score: number | null;
  onCommentChange: (value: string) => void;
  onScoreChange: (value: number | null) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function SuggestionDialog({
  open,
  onClose,
  suggestion,
  comment,
  score,
  onCommentChange,
  onScoreChange,
  onSubmit,
  loading = false,
}: SuggestionDialogProps) {
  if (!suggestion) return null;

  const getConfidenceColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "success";
      case "medium":
        return "info";
      case "low":
        return "warning";
      default:
        return "default";
    }
  };

  // Memoized validation check for form completeness
  const isFormValid = useMemo(() => {
    const hasValidComment = comment && comment.trim() !== "";
    const hasValidScore = score !== null;
    
    return hasValidComment && hasValidScore;
  }, [comment, score]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Edit Suggestion"
      maxWidth="md"
      primaryAction={{
        label: "Save",
        onClick: onSubmit,
        disabled: loading || !isFormValid,
        loading,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        disabled: loading,
      }}
    >
      <Stack spacing={3} sx={{ mt: 1 }}>
        {/* Metadata Section */}
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Type:
            </Typography>
            <Chip label={suggestion.llm_type || "-"} size="small" />
            <Typography variant="body2" color="text.secondary">
              Date:
            </Typography>
            <Typography variant="body2">
              {suggestion.created_at
                ? formatDateTime(suggestion.created_at)
                : "-"}
            </Typography>
          </Stack>
        </Box>

        <Divider />

        {/* LLM Result Section */}
        {suggestion.llm_result && (
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Suggestion Details
            </Typography>
            <Stack spacing={2}>
              {/* Action */}
              {suggestion.llm_result.action && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Action
                  </Typography>
                  <Typography variant="body1">
                    {suggestion.llm_result.action}
                  </Typography>
                </Box>
              )}

              {/* Section */}
              {suggestion.llm_result.section && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Section
                  </Typography>
                  <Typography variant="body1">
                    {suggestion.llm_result.section}
                  </Typography>
                </Box>
              )}

              {/* Confidence Level */}
              {suggestion.llm_result.confidence_level && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Confidence Level
                  </Typography>
                  <Chip
                    label={suggestion.llm_result.confidence_level}
                    color={getConfidenceColor(
                      suggestion.llm_result.confidence_level,
                    )}
                    size="small"
                  />
                </Box>
              )}

              {/* Reasoning */}
              {suggestion.llm_result.reasoning && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Reasoning
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {suggestion.llm_result.reasoning}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Score and Comment Section */}
        <Box>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Your Evaluation
          </Typography>
          <Stack spacing={2}>
            {/* Score Input */}
            <TextField
              label="Score"
              type="number"
              value={score ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  onScoreChange(null);
                } else {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
                    onScoreChange(numValue);
                  }
                }
              }}
              fullWidth
              placeholder="Enter a score (0-10)"
              disabled={loading}
              required
              slotProps={{
                htmlInput: {
                  min: 0,
                  max: 10,
                  step: 1,
                },
              }}
              helperText="Required: Rate this suggestion out of 10"
              error={score === null}
            />

            {/* Comment Input */}
            <TextField
              label="Your Comment"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="Add your notes or comments about this suggestion..."
              disabled={loading}
              required
              helperText="Required: Add your evaluation notes"
              error={!comment || comment?.trim() === ""}
            />
          </Stack>
        </Box>
      </Stack>
    </CustomDialog>
  );
}
