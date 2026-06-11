import axios from "axios";
import envConfigs from "../configs/env.configs";
import { store } from "../store";
import { logout } from "../store/slices/auth.slice";
import supabaseClient from "./supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";

const supabaseHttpClient = axios.create({
  baseURL: `${envConfigs.server.url}`,
});

supabaseHttpClient.interceptors.request.use((config) => {
  // Use the live session token if available, fall back to anon key
  const token = store.getState().auth.token;
  config.headers.authorization = `Bearer ${token ?? envConfigs.supabase.anonKey}`;
  config.headers.apikey = envConfigs.supabase.anonKey;
  config.headers["Content-Type"] = "application/json";
  return config;
});

supabaseHttpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Token expired or invalid — sign out and let AuthProvider redirect to /auth/signin
    if (error?.response?.status === 401) {
      store.dispatch(logout());
      await supabaseClient.auth.signOut();
    }

    const message = getErrorMessage(error);
    const formattedError = error || new Error(message);
    formattedError.message = message;
    return Promise.reject(formattedError);
  },
);

export default supabaseHttpClient;
