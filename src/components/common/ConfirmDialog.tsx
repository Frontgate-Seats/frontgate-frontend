import * as React from "react";
import { Typography, Box } from "@mui/material";
import { Warning, Error, Info, CheckCircle } from "@mui/icons-material";
import CustomDialog from "./CustomDialog";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  severity?: "warning" | "error" | "info" | "success";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "primary",
  severity,
  loading = false,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (severity) {
      case "warning":
        return <Warning color="warning" sx={{ fontSize: 48 }} />;
      case "error":
        return <Error color="error" sx={{ fontSize: 48 }} />;
      case "info":
        return <Info color="info" sx={{ fontSize: 48 }} />;
      case "success":
        return <CheckCircle color="success" sx={{ fontSize: 48 }} />;
      default:
        return null;
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        color: confirmColor,
        disabled: loading,
        loading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
        disabled: loading,
      }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        py={2}
      >
        {severity && getIcon()}
        {typeof message === "string" ? (
          <Typography variant="body1" textAlign="center">
            {message}
          </Typography>
        ) : (
          message
        )}
      </Box>
    </CustomDialog>
  );
}
