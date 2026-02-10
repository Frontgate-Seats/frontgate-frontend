import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

export interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  showCloseButton?: boolean;
  disableBackdropClick?: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  dividers?: boolean;
}

export default function CustomDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
  fullWidth = true,
  fullScreen = false,
  showCloseButton = true,
  disableBackdropClick = false,
  primaryAction,
  secondaryAction,
  dividers = false,
}: CustomDialogProps) {
  const handleClose = (_event: any, reason: string) => {
    if (disableBackdropClick && reason === "backdropClick") {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
    >
      {title && (
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {typeof title === "string" ? (
              <Typography variant="h6">{title}</Typography>
            ) : (
              title
            )}
            {showCloseButton && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                size="small"
                sx={{ ml: 2 }}
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      <DialogContent dividers={dividers}>{children}</DialogContent>

      {(actions || primaryAction || secondaryAction) && (
        <DialogActions>
          {actions ? (
            actions
          ) : (
            <>
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  variant="contained"
                  disabled={primaryAction.disabled}
                  color={primaryAction.color || "primary"}
                >
                  {primaryAction.label}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
