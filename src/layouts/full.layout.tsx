import { Box, styled } from "@mui/material";
import { Outlet } from "react-router-dom";
import type { StyledContainerProps } from "../shared/types/conainer.type";

const StyledContainer = styled(Box)<StyledContainerProps>(({ theme }) => ({
  height: "100vh",
  width: "100vw",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
}));

const FullLayout = () => {
  return (
    <StyledContainer>
      <Outlet />
    </StyledContainer>
  );
};

export default FullLayout;
