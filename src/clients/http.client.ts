import axios from "axios";
import envConfigs from "../configs/env.configs";

const token = localStorage.getItem("authToken");

const httpClient = axios.create({
  baseURL: envConfigs.server.url,
  headers: {
    Authorization: token ? `${token}` : undefined,
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error || "somthing went wrong")
);

export default httpClient;
