// src/components/common/StepperModal/types.ts

export interface StepData<T = any> {
  /** Title shown on the Stepper label */
  label: string;

  /** Rendered content (React node or function that returns JSX) */
  content: React.ReactNode | ((context: StepperContext) => React.ReactNode);

  /** Called when "Next" is pressed — should resolve true/false or throw error */
  onNext?: (context: StepperContext) => Promise<boolean> | boolean;

  /** Called when "Back" is pressed */
  onBack?: (context: StepperContext) => void;

  /** Optional data specific to this step */
  data?: T;
}

export interface StepperContext {
  /** Current step index */
  activeStep: number;

  /** Function to update context data */
  setContextData: (key: string, value: any) => void;

  /** Retrieve shared context */
  contextData: Record<string, any>;

  /** Move to the next step */
  nextStep: () => void;

  /** Move to the previous step */
  prevStep: () => void;
}

export interface StepperModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  steps: StepData[];
  layout?: "vertical" | "horizontal" | "side";
  completionContent?: React.ReactNode | ((contextData: Record<string, any>, onClose: () => void) => React.ReactNode);
}