import { createClient } from "@supabase/supabase-js";
import envConfigs from "../configs/env.configs";

// Regular client for frontend operations (RLS enabled)
const supabaseClient = createClient(
  envConfigs.supabase.url,
  envConfigs.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "frontgate-auth",
      flowType: "pkce",
    },
  }
);

export default supabaseClient;
