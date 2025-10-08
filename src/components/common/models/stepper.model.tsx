import React, { useState } from "react";
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
  Divider,
} from "@mui/material";
import type { StepperContext, StepperModalProps } from "./types.model";

const StepperModal: React.FC<StepperModalProps> = ({
  open,
  onClose,
  title,
  steps,
  layout = "vertical",
  completionContent,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [contextData, setContextDataState] = useState<Record<string, any>>({});

  const setContextData = (key: string, value: any) =>
    setContextDataState((prev) => ({ ...prev, [key]: value }));

  const nextStep = () =>
    setActiveStep((prev) => (prev + 1 < steps.length ? prev + 1 : prev));

  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const currentStep = activeStep < steps.length ? steps[activeStep] : null;
  const isLastStep = activeStep === steps.length - 1;

  const context: StepperContext = {
    activeStep,
    setContextData,
    contextData,
    nextStep,
    prevStep,
  };

  const handleNext = async () => {
    if (!currentStep) return;
    try {
      setLoading(true);
      const result = currentStep.onNext
        ? await currentStep.onNext(context)
        : true;
      if (result !== false) {
        if (isLastStep) setCompleted(true);
        else nextStep();
      }
    } catch (err) {
      console.error("Stepper next error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    currentStep?.onBack?.(context);
    prevStep();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
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
          {title && (
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
              {title}
            </Typography>
          )}

          {/* COMPLETED VIEW */}
          {completed ? (
            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {typeof completionContent === "function"
                ? completionContent(contextData, onClose)
                : completionContent || (
                    <Stack alignItems="center" spacing={2}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="success.main"
                      >
                        ✅ Completed!
                      </Typography>
                      <Typography color="text.secondary">
                        Your flow has been successfully completed.
                      </Typography>
                      <Button variant="contained" onClick={onClose}>
                        Close
                      </Button>
                    </Stack>
                  )}
            </Box>
          ) : (
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
                              ? step.content(context)
                              : step.content}

                            <Stack direction="row" spacing={2} mt={3}>
                              {activeStep > 0 && (
                                <Button variant="outlined" onClick={handleBack}>
                                  Back
                                </Button>
                              )}
                              <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={loading}
                              >
                                {loading ? (
                                  <CircularProgress size={22} color="inherit" />
                                ) : isLastStep ? (
                                  "Complete"
                                ) : (
                                  "Next"
                                )}
                              </Button>
                            </Stack>
                          </Box>
                        </StepContent>
                      )}
                    </Step>
                  ))}
                </Stepper>
              </Grid>
              
              {/* RIGHT CONTENT PANEL */}
              {layout !== "vertical" && (
                <Grid
                  size={{ xs: 12, md: layout === "side" ? 8 : 12 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                  }}
                >
                  <Box flex={1}>
                    {currentStep &&
                      (typeof currentStep.content === "function"
                        ? currentStep.content(context)
                        : currentStep.content)}
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    {activeStep > 0 && (
                      <Button variant="outlined" onClick={handleBack}>
                        Back
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : isLastStep ? (
                        "Complete"
                      ) : (
                        "Next"
                      )}
                    </Button>
                  </Stack>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default StepperModal;
