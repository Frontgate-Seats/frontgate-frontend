import { createClient } from "@supabase/supabase-js";
import envConfigs from "../configs/env.configs";

// Regular client for frontend operations (RLS enabled)
const supabaseClient = createClient(
  envConfigs.supabase.url,
  envConfigs.supabase.anonKey,
);

export default supabaseClient;
