import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    ONESIGNAL_APP_ID: z.string(),
    ONESIGNAL_API_KEY: z.string()
  },
  runtimeEnv: {
    ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID,
    ONESIGNAL_API_KEY: process.env.ONESIGNAL_API_KEY
  },
})