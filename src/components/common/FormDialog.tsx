import { TextField, Stack } from "@mui/material";
import CustomDialog from "./CustomDialog";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "password" | "textarea";
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  autoFocus?: boolean;
}

export interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  loading?: boolean;
  disableSubmit?: boolean;
}

export default function FormDialog({
  open,
  onClose,
  title,
  fields,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  maxWidth = "sm",
  loading = false,
  disableSubmit = false,
}: FormDialogProps) {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      primaryAction={{
        label: submitLabel,
        onClick: onSubmit,
        disabled: disableSubmit || loading,
        loading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
        disabled: loading,
      }}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {fields.map((field) => (
          <TextField
            key={field.name}
            label={field.label}
            type={field.type === "textarea" ? "text" : field.type || "text"}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            required={field.required}
            disabled={field.disabled || loading}
            multiline={field.multiline || field.type === "textarea"}
            rows={field.rows || (field.type === "textarea" ? 4 : undefined)}
            placeholder={field.placeholder}
            helperText={field.error ? field.errorText : field.helperText}
            error={field.error}
            autoFocus={field.autoFocus}
            fullWidth
          />
        ))}
      </Stack>
    </CustomDialog>
  );
}
