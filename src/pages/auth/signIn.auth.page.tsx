import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled, useColorScheme } from "@mui/material/styles";
import type { AppDispatch, RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "../../store/slices/auth.slice";
import { useNavigate } from "react-router-dom";
import FrontGateLogoBlack from "../../assets/img/frontgate_logo_black.png";
import FrontGateLogoWhite from "../../assets/img/frontgate_logo_white.png";

const LogoContainer = styled("div")({
  position: "relative",
  height: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& img": {
    maxHeight: 80,
  },
});

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage:
      "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage:
        "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

const SignInAuthPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const { mode } = useColorScheme();

  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    // Reset errors
    setEmailError(false);
    setEmailErrorMessage("");
    setPasswordError(false);
    setPasswordErrorMessage("");

    // Validate inputs
    let hasError = false;

    if (!email || !validateEmail(email)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      hasError = true;
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      hasError = true;
    }

    if (hasError) return;

    try {
      // Dispatch login
      await dispatch(signIn({ email, password })).unwrap();
      navigate("/");
    } catch (error) {
      // Error handling is done in the slice
      console.error("Sign in error:", error);
    }
  };

  return (
    <>
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <LogoContainer>
            <img 
              src={mode === "dark" ? FrontGateLogoWhite : FrontGateLogoBlack} 
              alt="Frontgate Logo" 
            />
          </LogoContainer>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl sx={{ display: 'none' }}>
              <TextField
                required
                fullWidth
                name="email"
                hidden
                placeholder="Enter your email"
                type="email"
                id="email"
                autoComplete="email"
                variant="outlined"
                size="small"
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? "error" : "primary"}
                defaultValue="admin@frontgate.com"
              />
            </FormControl>
            <FormControl>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                variant="outlined"
                size="small"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? "error" : "primary"}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Box>
        </Card>
      </SignUpContainer>
    </>
  );
};

export default SignInAuthPage;