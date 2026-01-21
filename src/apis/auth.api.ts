import supabaseClient from "../clients/supabase.client";
import type { SignInProps } from "./types";

export const signIn = async (payload: SignInProps) => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      throw error;
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  } catch (error) {
    throw error;
  }
};

const authApi = {
  signIn,
  signOut,
  getCurrentUser,
  getCurrentSession,
};

export default authApi;
