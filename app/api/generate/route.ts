import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Two different professional style prompts for variety
const STYLE_PROMPTS: Record<string, string[]> = {
  corporate: [
    'Professional corporate headshot of this exact person wearing a dark charcoal business suit, white dress shirt, and silk tie. Neutral grey studio background. Soft front studio lighting. Sharp focus. DSLR photography, 85mm lens. Photorealistic.',
    'Professional executive headshot of this exact person in a navy blue suit and tie. Light grey background. Rembrandt studio lighting. Sharp facial detail. Photorealistic DSLR portrait.',
  ],
  linkedin: [
    'Professional LinkedIn headshot of this exact person in smart business casual attire. Clean off-white background. Natural soft lighting. Warm approachable expression. Photorealistic DSLR portrait, 85mm lens.',
    'Professional profile photo of this exact person wearing a blazer. Light neutral background. Natural window lighting. Relaxed confident look. Photorealistic DSLR photography.',
  ],
  executive: [
    'Executive portrait of this exact person in a premium dark suit. Modern office background, shallow depth of field. Dramatic directional studio lighting. Sharp focus. Photorealistic DSLR, 85mm.',
    'Senior executive headshot of this exact person in a formal suit. Blurred corporate office background. Professional studio lighting. Authoritative confident expression. Photorealistic photography.',
  ],
  casual: [
    'Professional smart-casual headshot of this exact person in a neat blazer over an open-collar shirt. Warm cream background. Natural soft lighting. Friendly approachable expression. Photorealistic DSLR portrait.',
    'Professional casual headshot of this exact person in business casual clothing. Soft gradient background. Natural lighting. Genuine relaxed smile. Photorealistic photography, 85mm lens.',
  ],
};

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const style = (formData.get('style') as string) || 'corporate';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPEG, PNG, or WebP.' },
        { status: 400 }
      );
    }

    // Convert to base64 data URI for Replicate
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const prompts = STYLE_PROMPTS[style] || STYLE_PROMPTS.corporate;

    // Create predictions sequentially to avoid burst rate limits on Replicate
    const createPrediction = (prompt: string) =>
      replicate.predictions.create({
        model: 'black-forest-labs/flux-kontext-pro',
        input: {
          input_image: dataUri,
          prompt,
          aspect_ratio: '1:1',
          output_format: 'jpg',
          safety_tolerance: 2,
          prompt_upsampling: false,
        },
      });

    const pred1 = await createPrediction(prompts[0]);
    // Small delay between requests to respect Replicate's burst limit
    await new Promise((r) => setTimeout(r, 500));
    const pred2 = await createPrediction(prompts[1]);

    return NextResponse.json({ predictionIds: [pred1.id, pred2.id] });
  } catch (err: unknown) {
    console.error('[generate] Error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
