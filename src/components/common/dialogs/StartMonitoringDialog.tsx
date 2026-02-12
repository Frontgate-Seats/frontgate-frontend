import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
} from "@mui/material";

export type MonitorLevel = "low" | "medium" | "high" | "critical";

interface StartMonitoringDialogProps {
  open: boolean;
  eventName: string | null;
  onClose: () => void;
  onConfirm: (monitorLevel: MonitorLevel) => void;
}

const monitorLevelOptions: Array<{
  value: MonitorLevel;
  label: string;
  description: string;
  frequency: string;
}> = [
  {
    value: "low",
    label: "Low",
    description: "Basic monitoring for events with minimal activity",
    frequency: "Every 2 hours",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Standard monitoring for regular events",
    frequency: "Every hour",
  },
  {
    value: "high",
    label: "High",
    description: "Frequent monitoring for important events",
    frequency: "Every 30 minutes",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Real-time monitoring for high-priority events",
    frequency: "Every 5 minutes",
  },
];

export default function StartMonitoringDialog({
  open,
  eventName,
  onClose,
  onConfirm,
}: StartMonitoringDialogProps) {
  const [selectedLevel, setSelectedLevel] = React.useState<MonitorLevel>("medium");

  const handleConfirm = () => {
    onConfirm(selectedLevel);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start Monitoring Event</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Configure monitoring for: <strong>{eventName}</strong>
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Select the monitoring level based on event priority. Higher levels check more frequently
          but consume more resources.
        </Alert>

        <FormControl fullWidth>
          <InputLabel id="monitor-level-label">Monitor Level</InputLabel>
          <Select
            labelId="monitor-level-label"
            id="monitor-level-select"
            value={selectedLevel}
            label="Monitor Level"
            onChange={(e) => setSelectedLevel(e.target.value as MonitorLevel)}
          >
            {monitorLevelOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {option.label} - {option.frequency}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Start Monitoring
        </Button>
      </DialogActions>
    </Dialog>
  );
}
