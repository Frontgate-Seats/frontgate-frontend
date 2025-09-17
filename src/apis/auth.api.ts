import { AxiosError } from "axios";
import httpClient from "../clients/types";
import type { SignInProps } from "./types";

export const SignIn = async (payload: SignInProps) => {
  try {
    const response = await httpClient.post("/auth/signIn", payload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || "AxiosError  :Something went wrong";
  }
};

export const VerifyToken = async () => {
  try {
    const response = await httpClient.post("/auth/verifyToken");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || "AxiosError : Something went wrong ";
  }
};

const authService = {
  SignIn,
  VerifyToken,
};

export default authService;
