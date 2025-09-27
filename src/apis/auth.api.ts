import type { AxiosError } from "axios";
import httpClient from "../clients/http.client";
import type { SignInProps } from "./types";

export const signIn = async (payload: SignInProps) => {
  try {
    const response = await httpClient.post("/auth/signin", payload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || "AxiosError: Something went wrong";
  }
};

export const verifyToken = async () => {
  try {
    const response = await httpClient.post("/auth/verifyToken");
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw axiosError.response?.data || "AxiosError: Something went wrong";
  }
};

const authApi = {
  signIn,
  verifyToken
};

export default authApi;
