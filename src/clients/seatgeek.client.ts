import axios from "axios";
import envConfigs from "../configs/env.configs";

const seatGeekClient = axios.create({
  baseURL: envConfigs.seatgeek.apiBaseUrl,
});

seatGeekClient.interceptors.request.use((config) => {
  config.params.token = envConfigs.seatgeek.token;
  return config;
});

seatGeekClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error || "somthing went wrong")
);

export default seatGeekClient;
