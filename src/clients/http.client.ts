import axios from "axios";
import { store } from "../store";
import envConfigs from "../configs/env.configs";

const httpClient = axios.create({
  baseURL: envConfigs.server.url,
});

httpClient.interceptors.request.use((config) => {
  const token = store.getState().auth.token; 
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error || "somthing went wrong")
);

export default httpClient;
