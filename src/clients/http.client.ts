import axios from "axios";
import { store } from "../store";
import envConfigs from "../configs/env.configs";
import { getErrorMessage } from "../shared/utils/error.util";

const httpClient = axios.create({
  baseURL: `${envConfigs.server.url}/api`,
});

httpClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token; 
  if (token) config.headers.authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
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

export default httpClient;
