// ENV CONFIG FILE

/*----------------------------------
- IMPORTS
----------------------------------*/

// Node Modules
import { z } from "zod";

/*----------------------------------
- CONFIGS
----------------------------------*/

const envSchema = z.object({
  VITE_APP_SERVER_URL: z
    .string()
    .nonempty("Env : VITE_APP_SERVER_URL is missing."),
  // SUPABASE
  VITE_APP_SUPABASE_URL: z
    .string()
    .nonempty("Env : VITE_APP_SUPABASE_URL is missing."),
  VITE_APP_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .nonempty("Env : VITE_APP_SUPABASE_PUBLISHABLE_KEY is missing."),
  VITE_APP_SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .nonempty("Env : VITE_APP_SUPABASE_SERVICE_ROLE_KEY is missing."),
  VITE_APP_SUPABASE_ANON_KEY: z
    .string()
    .nonempty("Env : VITE_APP_SUPABASE_ANON_KEY is missing."),
});

const parsedEnv = envSchema.safeParse({
  VITE_APP_SERVER_URL: import.meta.env.VITE_APP_SERVER_URL,
  // SUPABASE
  VITE_APP_SUPABASE_URL: import.meta.env.VITE_APP_SUPABASE_URL,
  VITE_APP_SUPABASE_PUBLISHABLE_KEY: import.meta.env
    .VITE_APP_SUPABASE_PUBLISHABLE_KEY,
  VITE_APP_SUPABASE_SERVICE_ROLE_KEY: import.meta.env
    .VITE_APP_SUPABASE_SERVICE_ROLE_KEY,
  VITE_APP_SUPABASE_ANON_KEY: import.meta.env.VITE_APP_SUPABASE_ANON_KEY,
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(
      parsedEnv.error.issues,
      null,
      2,
    )}`,
  );
}

const envVars = parsedEnv.data;

const envConfigs = {
  server: {
    url: envVars.VITE_APP_SERVER_URL,
  },
  supabase: {
    url: envVars.VITE_APP_SUPABASE_URL,
    publishableKey: envVars.VITE_APP_SUPABASE_PUBLISHABLE_KEY,
    serviceRoleKey: envVars.VITE_APP_SUPABASE_SERVICE_ROLE_KEY,
    anonKey: envVars.VITE_APP_SUPABASE_ANON_KEY,
  },
} as const;

export default envConfigs;
