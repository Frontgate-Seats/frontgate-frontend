// src/components/common/StepperModal/types.ts

export interface StepData<T = any> {
  /** Title shown on the Stepper label */
  label: string;

  /** Rendered content (React node or function that returns JSX) */
  content: React.ReactNode | ((onClose: () => void) => React.ReactNode);

  /** Called when "Next" is pressed — should resolve true/false or throw error */
  nextButton?: React.ReactNode;

  /** Called when "Back" is pressed */
  onBack?: () => void;

  /** Optional data specific to this step */
  data?: T;
}

export interface StepperModalProps {
  open: boolean;
  onClose: () => void;

  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;

  headerContent?: React.ReactNode | ((onClose: () => void) => React.ReactNode);
  steps: StepData[];

  initialLoading?: boolean;
  loadingContent?: React.ReactNode;

  layout?: "vertical" | "horizontal" | "side";

  successContent: React.ReactNode | ((onClose: () => void) => React.ReactNode);
  errorContent: React.ReactNode | ((onClose: () => void) => React.ReactNode);

  completed: boolean;
  error: boolean;
}
