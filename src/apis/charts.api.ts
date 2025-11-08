// client/src/apis/charts.api.ts
import httpClient from "../clients/http.client";

const chartsApi = {
  fetchTopEvents: async (params: {
    from: string;
    to?: string;
    field: string;
  }) => {
    return httpClient.get("/charts/listingsMeta", { params });
  },
};

export default chartsApi;
