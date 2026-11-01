import * as React from "react";
import { Box, IconButton, Modal, Backdrop } from "@mui/material";
import { Fullscreen, Close } from "@mui/icons-material";

interface ToggleFullscreenProps {
  children: React.ReactNode;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  fillHeight?: boolean;
  /**
   * Controlled open state. When provided, the built-in floating button is
   * hidden and the parent drives open/close (e.g. a button in its own header).
   */
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const ToggleFullscreen: React.FC<ToggleFullscreenProps> = ({
  children,
  onFullscreenChange,
  fillHeight = false,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleFullscreenToggle = (isOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(isOpen);
    } else {
      setUncontrolledOpen(isOpen);
    }
    onFullscreenChange?.(isOpen);
  };

  return (
    <>
      {/* Normal View */}
      <Box sx={{
        position: "relative",
        ...(fillHeight && { height: "100%", width: "100%", minHeight: 0, display: "flex", flexDirection: "column" }),
      }}>
        {/* Built-in floating trigger — only when uncontrolled */}
        {!isControlled && (
          <IconButton
            size="large"
            onClick={() => handleFullscreenToggle(true)}
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              zIndex: 1,
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <Fullscreen />
          </IconButton>
        )}

        {children}
      </Box>

      {/* Fullscreen Modal */}
      <Modal
        open={open}
        onClose={() => handleFullscreenToggle(false)}
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.8)" } },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "95vw",
            height: "95vh",
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 2,
            outline: "none",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={() => handleFullscreenToggle(false)}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              color: "text.secondary",
              backgroundColor: "background.paper",
              transform: "translate(50%, -50%)",
              boxShadow: 2,
              borderColor: "divider",
              "&:hover": {
                color: "error.main",
                backgroundColor: "background.paper",
                boxShadow: 4,
                transform: "translate(50%, -50%) scale(1.1)",
                borderColor: "error.main",
              },
            }}
          >
            <Close />
          </IconButton>

          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {children}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ToggleFullscreen;
