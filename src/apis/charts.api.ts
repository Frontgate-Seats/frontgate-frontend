// client/src/apis/charts.api.ts
import httpClient from "../clients/http.client";

const chartsApi = {
  fetchTopEvents: async (params: {
    from: string;
    to: string;
    field: string;
    limit?: number;
  }) => {
    return httpClient.get("/charts/top", { params });
  },
};

export default chartsApi;
