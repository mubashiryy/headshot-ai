import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const HEADSHOT_PROMPTS = [
  'RAW photo, professional corporate headshot, business formal suit, neutral gray background, sharp focus, photorealistic, DSLR 85mm portrait, natural studio lighting, skin texture visible',
  'RAW photo, professional LinkedIn profile photo, business casual attire, clean blue-gray background, natural relaxed expression, photorealistic, DSLR portrait, no filter',
  'RAW photo, executive portrait, formal dark suit, modern office environment, photorealistic, natural window light, 85mm lens, candid professional look',
  'RAW photo, professional headshot, smart casual attire, warm white background, genuine approachable expression, photorealistic, DSLR, no post-processing',
];

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

    const stylePrompts: Record<string, string> = {
      corporate: HEADSHOT_PROMPTS[0],
      linkedin: HEADSHOT_PROMPTS[1],
      executive: HEADSHOT_PROMPTS[2],
      casual: HEADSHOT_PROMPTS[3],
    };

    const prompt = stylePrompts[style] || stylePrompts.corporate;

    // Start async prediction — returns immediately with an ID
    const prediction = await replicate.predictions.create({
      version:
        process.env.PHOTOMAKER_VERSION ||
        'ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4',
      input: {
        input_image: dataUri,
        prompt: `img, ${prompt}`,
        style_name: 'Photographic (Default)',
        num_outputs: 2,
        guidance_scale: 7,
        num_inference_steps: 30,
        style_strength_ratio: 15,
        negative_prompt:
          'nsfw, nude, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, cartoon, anime, illustration, painting',
      },
    });

    return NextResponse.json({ predictionId: prediction.id });
  } catch (err: unknown) {
    console.error('[generate] Error:', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
