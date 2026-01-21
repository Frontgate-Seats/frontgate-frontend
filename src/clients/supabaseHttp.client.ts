import axios from "axios";
import envConfigs from "../configs/env.configs";

const supabaseHttpClient = axios.create({
  baseURL: `${envConfigs.supabase.url}`,
});

supabaseHttpClient.interceptors.request.use((config) => {
  config.headers.authorization = `Bearer ${envConfigs.supabase.anonKey}`;
  config.headers.apikey = envConfigs.supabase.anonKey;
  return config;
});

supabaseHttpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error || "somthing went wrong"),
);

export default supabaseHttpClient;
