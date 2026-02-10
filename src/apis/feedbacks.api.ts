import { getDBData } from "../shared/helpers/supabase.helper";
import type { DataGridQueryOptions } from "../shared/types/mui.type";
import supabaseClient from "../clients/supabase.client";

export interface Feedback {
  id: string;
  event_id?: number | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackPayload {
  event_id?: number;
  comment?: string;
}

export interface UpdateFeedbackPayload {
  id: string;
  event_id?: number;
  comment?: string;
}

const feedbacksApi = {
  // Fetch all feedbacks with pagination and filters
  fetchFeedbacks: async (options: DataGridQueryOptions = {}) => {
    return getDBData("feedbacks", options);
  },

  // Fetch feedbacks for a specific event
  fetchFeedbacksByEvent: async (eventId: number, options: DataGridQueryOptions = {}) => {
    const { data, error, count } = await supabaseClient
      .from("feedbacks")
      .select("*", { count: "exact" })
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Failed to fetch feedbacks");
    }

    return {
      data: data || [],
      total: count || 0,
    };
  },

  // Create a new feedback
  createFeedback: async (payload: CreateFeedbackPayload) => {
    const { data, error } = await supabaseClient
      .from("feedbacks")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to create feedback");
    }

    return data;
  },

  // Update an existing feedback
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

  // Delete a feedback
  deleteFeedback: async (id: string) => {
    const { error } = await supabaseClient
      .from("feedbacks")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message || "Failed to delete feedback");
    }

    return { success: true };
  },
};

export default feedbacksApi;
