import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";

export interface UpdateSuggestPayload {
  id: string;
  llm_result_comment?: string;
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
      throw new Error(error.message || "Failed to update suggest");
    }

    return data;
  },
};

export default suggestsApi;
