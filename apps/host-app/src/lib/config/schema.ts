import { z } from 'zod';

export const appConfigSchema = z
  .object({
    env: z.enum(['development', 'qa', 'production']),
    api: z.object({
      baseUrl: z.string().min(1),
      timeoutMs: z.number().int().positive().default(10_000),
    }),
    remotes: z.object({ passportForm: z.object({ manifestUrl: z.url() }) }),
    logging: z.object({ level: z.enum(['debug', 'info', 'warn', 'error']) }),
    features: z.object({ devPanel: z.boolean(), browserMocks: z.boolean() }),
  })
  .refine((config) => !(config.env === 'production' && config.features.browserMocks), {
    path: ['features', 'browserMocks'],
    message: 'browserMocks must be false in production',
  })
  .refine((config) => !(config.env === 'production' && config.features.devPanel), {
    path: ['features', 'devPanel'],
    message: 'devPanel must be false in production',
  });

export type AppConfig = z.infer<typeof appConfigSchema>;
export type AppEnv = AppConfig['env'];
