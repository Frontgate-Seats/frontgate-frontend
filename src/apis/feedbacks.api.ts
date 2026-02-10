import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";

export interface UpdateFeedbackPayload {
  id: string;
  comment?: string;
}

const feedbacksApi = {
  fetchFeedbacks: async (options: DataGridQueryOptions = {}) => {
    return getDBData("feedbacks", options);
  },

  updateFeedback: async (payload: UpdateFeedbackPayload) => {
    const { id, ...updateData } = payload;
    const { data, error } = await supabaseClient
      .from("feedbacks")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to update feedback");
    }

    return data;
  },
};

export default feedbacksApi;
