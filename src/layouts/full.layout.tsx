import { Stack } from "@mui/material";
import { Outlet } from "react-router-dom";

const FullLayout = () => {
  return (
    <Stack
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Outlet />
    </Stack>
  );
};

export default FullLayout;
