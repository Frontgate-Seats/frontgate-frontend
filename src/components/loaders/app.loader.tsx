import { Grid } from "@mui/material";
import Loader from "../../assets/json/loader.json";
import AnimationLottie from "../lotties/animation.lottie";

const AppLoader = () => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{ height: "100%", width: "100%" }}
    >
        <AnimationLottie animationData={Loader} height={100} width={100} />
    </Grid>
  );
};

export default AppLoader;
