import httpClient from "../clients/http.client";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import { getErrorMessage } from "../shared/utils/error.util";

// Backend is expected to return: { data: Event[], total: number }
export const fetchSalesMeta = async ({
  page,
  pageSize,
  sortFields,
  filters,
  search,
}: DataGridQueryOptions) => {
  try {
    const params = {
      page,
      pageSize,
      ...(sortFields ? { sortFields: JSON.stringify(sortFields) } : []),
      ...(filters ? { filters: JSON.stringify(filters) } : []),
      search,
    };

    return await httpClient.get("/salesMeta", { params });
  } catch (error: any) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
};

const salesMetaApi = {
  fetchSalesMeta,
};
export default salesMetaApi;
