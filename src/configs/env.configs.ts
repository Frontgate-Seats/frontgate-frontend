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
});

const parsedEnv = envSchema.safeParse({
  VITE_APP_SERVER_URL: import.meta.env.VITE_APP_SERVER_URL,
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(
      parsedEnv.error.issues,
      null,
      2
    )}`
  );
}

const envVars = parsedEnv.data;

const envConfigs = {
  server: {
    url: envVars.VITE_APP_SERVER_URL,
  },
} as const;

export default envConfigs;
