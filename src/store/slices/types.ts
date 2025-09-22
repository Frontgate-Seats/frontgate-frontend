// AUTH

export type SignInProps = {
  email?: FormDataEntryValue;
  password: FormDataEntryValue;
};

export type VerifyTokenProps = {
    token: string;
}

export type UserStateSlice = {
  loading: boolean;
  user: object | null;
  token: string | null;
  error: object | null | string;
};


// THEME

export type ThemeMode = "light" | "dark";

export type ThemeStateSlice = {
    mode: ThemeMode;
}

// SnackBar

export type SnackbarSeverity = "success" | "error" | "warning" | "info";
export type SnackbarVariant = "filled" | "outlined" | "standard";

export type SnackbarAnchorOrigin = {
  vertical: "top" | "bottom";
  horizontal: "left" | "center" | "right";
}

export type SnackbarStateSlice ={
    open: boolean;
  duration: number;
  message: string;
  severity: SnackbarSeverity;
  variant: SnackbarVariant;
  anchorOrigin: SnackbarAnchorOrigin;

}