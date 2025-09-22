import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";

export const verifyToken = async () => {
  try {
    const response = await httpClient.get("/token/verifyAuth");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || "AxiosError: Something went wrong";
  }
};

const tokenApi = {
  verifyToken,
};
export default tokenApi;
