/**
 * Image Prompt Tool
 * Ferramenta para gerar prompts detalhados para IAs geradoras de imagem
 */

export interface ImagePromptParams {
  concept: string;
  style?: string;
  mood?: string;
  colors?: string[];
  format?: 'square' | 'portrait' | 'landscape' | 'story';
  platform?: 'instagram' | 'linkedin' | 'facebook' | 'youtube';
  includeText?: string;
  brandColors?: string[];
  references?: string;
}

export interface ImagePromptResult {
  midjourney: string;
  dalle: string;
  sdxl: string;
  negativePrompt: string;
  aspectRatio: string;
  suggestedSettings: {
    style: string;
    quality: string;
    version: string;
  };
}

/**
 * Generate detailed prompts for image generation AI
 */
export function generateImagePrompt(params: ImagePromptParams): ImagePromptResult {
  const {
    concept,
    style = 'modern, professional',
    mood = 'vibrant, engaging',
    colors = [],
    format = 'square',
    platform = 'instagram',
    includeText,
    brandColors = [],
    references,
  } = params;

  // Determine aspect ratio
  const aspectRatios: Record<string, string> = {
    square: '1:1',
    portrait: '4:5',
    landscape: '16:9',
    story: '9:16',
  };
  const aspectRatio = aspectRatios[format] || '1:1';

  // Build color string
  const colorPalette = [...brandColors, ...colors].filter(Boolean);
  const colorString = colorPalette.length > 0 
    ? `color palette: ${colorPalette.join(', ')}` 
    : '';

  // Platform-specific adjustments
  const platformAdjustments: Record<string, string> = {
    instagram: 'social media ready, eye-catching, scroll-stopping',
    linkedin: 'professional, corporate, business-appropriate',
    facebook: 'social media optimized, shareable, engaging',
    youtube: 'thumbnail-worthy, high contrast, bold',
  };
  const platformStyle = platformAdjustments[platform] || '';

  // Build Midjourney prompt
  const midjourneyParts = [
    concept,
    style,
    mood,
    platformStyle,
    colorString,
    references ? `inspired by ${references}` : '',
    'high quality, professional photography',
    '--ar', aspectRatio.replace(':', ' '),
    '--v 6',
    '--q 2',
  ].filter(Boolean);

  const midjourney = midjourneyParts.join(', ').replace(/, --/g, ' --');

  // Build DALL-E prompt (more natural language)
  const dallePrompt = `Create a ${style} image of ${concept}. 
The mood should be ${mood}. 
${colorString ? `Use ${colorString}.` : ''}
${platformStyle ? `Style should be ${platformStyle}.` : ''}
${references ? `Reference style: ${references}.` : ''}
${includeText ? `Include the text "${includeText}" prominently.` : ''}
High quality, professional.`;

  // Build SDXL prompt
  const sdxlPrompt = `${concept}, ${style}, ${mood}, ${platformStyle}, ${colorString}, 
professional quality, highly detailed, 8k resolution, sharp focus`.replace(/,\s*,/g, ',');

  // Negative prompt
  const negativePrompt = `blurry, low quality, distorted, deformed, ugly, 
bad anatomy, watermark, signature, text overlay, cropped, 
amateur, unprofessional, stock photo look`.replace(/\n/g, ' ');

  return {
    midjourney,
    dalle: dallePrompt.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
    sdxl: sdxlPrompt.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
    negativePrompt,
    aspectRatio,
    suggestedSettings: {
      style: style,
      quality: 'high',
      version: 'v6 (Midjourney) / DALL-E 3 / SDXL 1.0',
    },
  };
}

/**
 * Generate thumbnail-specific prompts
 */
export function generateThumbnailPrompt(params: {
  title: string;
  emotion: string;
  style: string;
  brandColors?: string[];
}): ImagePromptResult {
  return generateImagePrompt({
    concept: `YouTube thumbnail for video titled "${params.title}", 
featuring ${params.emotion} expression, bold visual impact, 
text-friendly layout with clear focal point`,
    style: params.style,
    mood: 'high energy, attention-grabbing',
    format: 'landscape',
    platform: 'youtube',
    brandColors: params.brandColors,
  });
}

/**
 * Generate carousel slide prompts
 */
export function generateCarouselPrompts(params: {
  topic: string;
  slideCount: number;
  style: string;
  brandColors?: string[];
}): ImagePromptResult[] {
  const prompts: ImagePromptResult[] = [];
  
  const slideTypes = [
    'hook slide, bold statement, attention-grabbing',
    'problem/pain point illustration',
    'solution presentation, positive imagery',
    'step-by-step visual, instructional',
    'proof/results, data visualization',
    'call to action, engaging',
  ];

  for (let i = 0; i < params.slideCount; i++) {
    const slideType = slideTypes[i % slideTypes.length];
    prompts.push(generateImagePrompt({
      concept: `${params.topic} - ${slideType}`,
      style: params.style,
      format: 'portrait',
      platform: 'instagram',
      brandColors: params.brandColors,
    }));
  }

  return prompts;
}

/**
 * Tool definition for agent use
 */
export const imagePromptTool = {
  name: 'image_prompt_generator',
  description: 'Gera prompts detalhados para IAs geradoras de imagem (Midjourney, DALL-E, SDXL)',
  execute: async (params: ImagePromptParams) => {
    const result = generateImagePrompt(params);
    return JSON.stringify(result, null, 2);
  },
};
