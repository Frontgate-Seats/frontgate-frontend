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

export interface SuggestionDialogProps {
  open: boolean;
  onClose: () => void;
  suggestion: any;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function SuggestionDialog({
  open,
  onClose,
  suggestion,
  comment,
  onCommentChange,
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

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Edit Suggestion"
      maxWidth="md"
      primaryAction={{
        label: "Save",
        onClick: onSubmit,
        disabled: loading,
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
                      suggestion.llm_result.confidence_level
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

        {/* Comment Section */}
        <Box>
          <TextField
            label="Your Comment"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Add your notes or comments about this suggestion..."
            disabled={loading}
            autoFocus
          />
        </Box>
      </Stack>
    </CustomDialog>
  );
}
