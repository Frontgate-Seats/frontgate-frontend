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
            bottom: 4,
            left: 8,
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
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "background.paper",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
        >
          <IconButton
            onClick={handleFullscreenClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 3,
              color: "text.secondary",
              "&:hover": { color: "error.main" },
              bgcolor: "background.paper",
              boxShadow: 1,
            }}
          >
            <Close />
          </IconButton>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              pt: 6,
              display: "flex",
              flexDirection: "column",
              "& > *": {
                flex: 1,
                minHeight: 0,
              },
            }}
          >
            {children}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ToggleFullscreen;
