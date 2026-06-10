import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import { styled, useColorScheme } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { signInWithGoogle } from "../../store/slices/auth.slice";
import FrontGateLogoBlack from "../../assets/img/frontgate_logo_black.png";
import FrontGateLogoWhite from "../../assets/img/frontgate_logo_white.png";

// ─── Google "G" SVG icon ──────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.19 29.53 1 24 1 14.82 1 7.07 6.48 3.68 14.24l7.07 5.49C12.43 13.57 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.99-2.2 5.52-4.68 7.22l7.19 5.58C43.31 37.37 46.52 31.39 46.52 24.5z" />
    <path fill="#FBBC05" d="M10.75 28.27A14.57 14.57 0 0 1 9.5 24c0-1.49.26-2.93.72-4.27L3.15 14.24A23.94 23.94 0 0 0 0 24c0 3.86.92 7.5 2.55 10.73l8.2-6.46z" />
    <path fill="#34A853" d="M24 47c5.52 0 10.16-1.83 13.54-4.97l-7.19-5.58C28.57 37.83 26.39 38.5 24 38.5c-6.24 0-11.54-4.06-13.25-9.7l-8.2 6.46C6.16 43.28 14.44 47 24 47z" />
  </svg>
);

// ─── Styled components ────────────────────────────────────────────────────────

const LogoContainer = styled("div")({
  height: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& img": { maxHeight: 80 },
});

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(3),
  margin: "auto",
  boxShadow: "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: { width: "400px" },
  ...theme.applyStyles("dark", {
    boxShadow: "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

const PageContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: { padding: theme.spacing(4) },
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundImage: "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
    backgroundRepeat: "no-repeat",
    ...theme.applyStyles("dark", {
      backgroundImage: "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
    }),
  },
}));

// ─── Component ────────────────────────────────────────────────────────────────

const SignInAuthPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);
  const { mode } = useColorScheme();

  const handleGoogleSignIn = () => {
    dispatch(signInWithGoogle());
  };

  return (
    <PageContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <LogoContainer>
          <img
            src={mode === "dark" ? FrontGateLogoWhite : FrontGateLogoBlack}
            alt="Frontgate Logo"
          />
        </LogoContainer>

        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} /> : <GoogleIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderColor: "divider",
            color: "text.primary",
            "&:hover": { borderColor: "text.secondary", bgcolor: "action.hover" },
          }}
        >
          Sign in with Google
        </Button>
      </Card>
    </PageContainer>
  );
};

export default SignInAuthPage;
