import { createClient } from "@supabase/supabase-js";
import envConfigs from "../configs/env.configs";

// Regular client for frontend operations (RLS enabled)
const supabase = createClient(
  envConfigs.supabase.url,
  envConfigs.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);


export default supabase;