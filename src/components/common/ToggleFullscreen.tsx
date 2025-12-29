import * as React from "react";
import { Box, IconButton, Modal, Backdrop } from "@mui/material";
import { Fullscreen, Close } from "@mui/icons-material";

interface ToggleFullscreenProps {
  children: React.ReactNode;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const ToggleFullscreen: React.FC<ToggleFullscreenProps> = ({
  children,
  onFullscreenChange,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleFullscreenToggle = (isOpen: boolean) => {
    setOpen(isOpen);
    onFullscreenChange?.(isOpen);
  };

  return (
    <>
      {/* Normal View */}
      <Box sx={{ position: "relative" }}>
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
              transform: "translate(40%, -40%)",
              "&:hover": { color: "error.main" },
            }}
          >
            <Close />
          </IconButton>

          <Box sx={{ height: "100%" }}>
            {children}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ToggleFullscreen;
