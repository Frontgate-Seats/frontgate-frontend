import React, { useCallback, useMemo } from "react";
import {
  Box,
  Modal,
  Fade,
  Backdrop,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Grid,
  IconButton,
} from "@mui/material";
import type { StepperModalProps } from "./types.model";
import CloseIcon from "@mui/icons-material/Close";

const StepperModal: React.FC<StepperModalProps> = ({
  open,
  onClose,

  activeStep,
  setActiveStep,
  initialLoading = false,
  loadingContent,

  headerContent,
  steps,

  layout = "vertical",

  successContent,
  errorContent,

  error,
  completed,
}) => {
  const currentStep = useMemo(
    () => (activeStep < steps.length ? steps[activeStep] : null),
    [activeStep, steps]
  );

  const handleBack = useCallback(() => {
    currentStep?.onBack?.();
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, [currentStep, setActiveStep]);

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 400 } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: 900,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            p: { xs: 3, md: 5 },
            outline: "none",
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 5,
              right: 5,
              color: "text.secondary",
              "&:hover": { color: "text.primary" },
            }}
          >
            <CloseIcon />
          </IconButton>
          {typeof headerContent === "function"
            ? headerContent(onClose)
            : headerContent}
          {/* ✅ INITIAL LOADER */}
          {initialLoading ? (
            <Box
              sx={{
                minHeight: 350,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                textAlign: "center",
              }}
            >
              {loadingContent ? (
                loadingContent
              ) : (
                <>
                  <CircularProgress size={48} sx={{ mb: 2 }} />
                  <Typography color="text.secondary">
                    Loading, please wait...
                  </Typography>
                </>
              )}
            </Box>
          ) : error ? (
            // ✅ ERROR VIEW
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {typeof errorContent === "function"
                ? errorContent(onClose)
                : errorContent}
            </Box>
          ) : completed ? (
            // ✅ SUCCESS VIEW
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {typeof successContent === "function"
                ? successContent(onClose)
                : successContent}
            </Box>
          ) : (
            // ✅ NORMAL FLOW
            <Grid
              container
              spacing={4}
              sx={{
                flexDirection:
                  layout === "side"
                    ? { xs: "column", md: "row" }
                    : layout === "horizontal"
                    ? "column"
                    : "column",
              }}
            >
              {/* LEFT STEPPER PANEL */}
              <Grid
                size={{ xs: 12, md: layout === "side" ? 4 : 12 }}
                sx={{
                  borderRight: layout === "side" ? "1px solid" : "none",
                  borderColor: "divider",
                  pr: layout === "side" ? 3 : 0,
                }}
              >
                <Stepper
                  activeStep={activeStep}
                  orientation={
                    layout === "vertical" ? "vertical" : "horizontal"
                  }
                  alternativeLabel={layout === "horizontal"}
                >
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepLabel>{step.label}</StepLabel>
                      {layout === "vertical" && (
                        <StepContent>
                          <Box mt={2}>
                            {typeof step.content === "function"
                              ? step.content(onClose)
                              : step.content}
                            <Stack direction="row" spacing={2} mt={3}>
                              {activeStep > 0 && (
                                <Button variant="outlined" onClick={handleBack}>
                                  Back
                                </Button>
                              )}
                              {step.nextButton}
                            </Stack>
                          </Box>
                        </StepContent>
                      )}
                    </Step>
                  ))}
                </Stepper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default StepperModal;
