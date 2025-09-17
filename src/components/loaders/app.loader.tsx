import { Grid } from "@mui/material";
import Loader from "../../assets/json/loader.json";
import AnimationLottie from "../lotties/animation.lottie";

const AppLoader = () => {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      style={{ height: "100vh" }}
    >
      <Grid>
        <AnimationLottie animationData={Loader} height={200} width={200} />
      </Grid>
    </Grid>
  );
};

export default AppLoader;
