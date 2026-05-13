// client/src/apis/charts.api.ts
import httpClient from "../clients/http.client";
import { getErrorMessage } from "../shared/utils/error.util";

const chartsApi = {
  fetchTopEvents: async (params: {
    from: string;
    to?: string;
    field: string;
  }) => {
    try {
      return await httpClient.get("/charts/listingsMeta", { params });
    } catch (error: any) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  },
};

export default chartsApi;
