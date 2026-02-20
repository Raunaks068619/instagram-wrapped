import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export async function generateWrappedImage(prompt: string): Promise<string> {
  if (!client) {
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`;
  }

  const response = await client.images.generate({
    model: env.OPENAI_IMAGE_MODEL,
    prompt,
    size: '1024x1024'
  });

  const b64 = response.data?.[0]?.b64_json;
  const url = response.data?.[0]?.url;

  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;
  return `https://picsum.photos/seed/fallback-wrapped/1024/1024`;
}
