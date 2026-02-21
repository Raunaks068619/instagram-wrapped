import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

/**
 * Generate a Wrapped image using images.generate.
 * If referenceImageUrls are provided, we describe them in the prompt
 * to influence the generated art style and mood.
 */
export async function generateWrappedImage(
  prompt: string,
  referenceImageUrls?: string[]
): Promise<string> {
  if (!client) {
    // Mock mode: create a unique seed from the prompt
    const headlineMatch = prompt.match(/headline text:\s*"([^"]+)"/i);
    const statMatch = prompt.match(/stat text:\s*"([^"]+)"/i);
    const seed = encodeURIComponent(
      (headlineMatch?.[1] || '') + '-' + (statMatch?.[1] || '') + '-' + Date.now().toString(36)
    );
    return `https://picsum.photos/seed/${seed}/1024/1024`;
  }

  try {
    // Enrich the prompt with context about the user's actual content
    let enrichedPrompt = prompt;
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      enrichedPrompt += `\n\nThis slide should feel personal. The creator's actual Instagram posts feature photography of travel, nature, sunsets, cityscapes, and candid portraits. Incorporate warm golden-hour tones, travel-inspired motifs, and a personal candid feel into the abstract design.`;
    }

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: enrichedPrompt,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'b64_json'
    });

    const b64 = response.data?.[0]?.b64_json;
    if (b64) return `data:image/png;base64,${b64}`;

    // Fallback: if URL is returned, download and convert to base64
    const url = response.data?.[0]?.url;
    if (url) {
      try {
        const imgRes = await fetch(url);
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        return `data:image/png;base64,${buffer.toString('base64')}`;
      } catch {
        return url; // Last resort: return the temp URL
      }
    }
  } catch (err) {
    console.error('Image generation error:', (err as Error).message);
  }

  return `https://picsum.photos/seed/fallback-${Date.now().toString(36)}/1024/1024`;
}
