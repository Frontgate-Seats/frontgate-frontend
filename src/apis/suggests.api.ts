import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";
import { getErrorMessage } from "../shared/utils/error.util";

export interface UpdateSuggestPayload {
  id: string;
  llm_result_comment?: string;
  llm_result_score?: number | null;
}

const suggestsApi = {
  fetchSuggests: async (options: DataGridQueryOptions = {}) => {
    return getDBData("suggests", options);
  },

  updateSuggest: async (payload: UpdateSuggestPayload) => {
    const { id, ...updateData } = payload;
    const { data, error } = await supabaseClient
      .from("suggests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    return data;
  },
};

export default suggestsApi;
