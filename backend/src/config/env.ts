import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env' });

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().default('change-me'),
  LOG_LEVEL: z.string().default('info'),
  MOCK_MODE: z.string().default('true').transform((v) => v === 'true'),
  INSTAGRAM_CLIENT_ID: z.string().optional(),
  INSTAGRAM_CLIENT_SECRET: z.string().optional(),
  INSTAGRAM_REDIRECT_URI: z.string().default('http://localhost:4000/auth/instagram/callback'),
  INSTAGRAM_SCOPES: z.string().default('instagram_basic,instagram_manage_insights,pages_show_list'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_IMAGE_MODEL: z.string().default('gpt-image-1')
});

export const env = envSchema.parse(process.env);
