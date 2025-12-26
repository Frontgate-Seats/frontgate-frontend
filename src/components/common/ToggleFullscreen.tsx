import * as React from "react";
import { Box, IconButton, Modal, Backdrop } from "@mui/material";
import { Fullscreen, Close } from "@mui/icons-material";

interface ToggleFullscreenProps {
  children: React.ReactNode;
  title?: string;
  buttonProps?: {
    size?: "small" | "medium" | "large";
    sx?: object;
  };
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const ToggleFullscreen: React.FC<ToggleFullscreenProps> = ({
  children,
  title,
  buttonProps = { size: "large", sx: {} },
  onFullscreenChange,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleFullscreenOpen = () => {
    setIsFullscreen(true);
    onFullscreenChange?.(true);
  };

  const handleFullscreenClose = () => {
    setIsFullscreen(false);
    onFullscreenChange?.(false);
  };

  return (
    <>
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={handleFullscreenOpen}
          size={buttonProps.size}
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            zIndex: 2,
            color: "text.secondary",
            "&:hover": { color: "primary.main" },
            ...buttonProps.sx,
          }}
        >
          <Fullscreen />
        </IconButton>
        {children}
      </Box>

      <Modal
        open={isFullscreen}
        onClose={handleFullscreenClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95vw",
            height: "95vh",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            outline: "none",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <IconButton
                onClick={handleFullscreenClose}
                sx={{
                  position: "relative",
                  color: "text.secondary",
                  "&:hover": { color: "error.main" },
                }}
              >
                <Close />
              </IconButton>
            </Box>
            <Box
              sx={{ height: title ? "calc(100% - 60px)" : "calc(100% - 60px)" }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ToggleFullscreen;
