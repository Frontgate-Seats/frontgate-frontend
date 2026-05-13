import axios from "axios";
import envConfigs from "../configs/env.configs";
import { getErrorMessage } from "../shared/utils/error.util";

const supabaseHttpClient = axios.create({
  baseURL: `${envConfigs.server.url}`,
});

supabaseHttpClient.interceptors.request.use((config) => {
  config.headers.authorization = `Bearer ${envConfigs.supabase.anonKey}`;
  config.headers.apikey = envConfigs.supabase.anonKey;
  config.headers['Content-Type'] = 'application/json';
  return config;
});

supabaseHttpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = getErrorMessage(error);
    // Create a new error with the extracted message for better handling
    const formattedError = error || new Error(message);
    // Ensure the error has the message property set correctly
    formattedError.message = message;
    return Promise.reject(formattedError);
  }
);

export default supabaseHttpClient;
