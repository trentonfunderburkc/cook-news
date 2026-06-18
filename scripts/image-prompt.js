import OpenAI from 'openai';
import { withRetry } from './lib/retry.js';
import { geminiGenerateText, isGeminiConfigured } from './gemini.js';

const API_TIMEOUT_MS = parseInt(process.env.API_TIMEOUT_MS || '60000', 10);

const SCENE_SYSTEM_PROMPT =
  'Опиши ОДНУ конкретную фотографию для иллюстрации русскоязычной кулинарной статьи. Ответ на английском, 2-3 предложения. Сцена: готовое блюдо на домашней кухне, процесс готовки на сковороде или в духовке, свежие продукты на столе. Без людей в кадре или только руки. Локация: обычная российская кухня. Стиль: любительское фото с телефона для кулинарного блога. В кадре НЕТ текста, вывесок, надписей.';

export function extractSceneFromTitle(title) {
  const t = title.toLowerCase();
  const scenes = [
    [/торт|пирог|кекс|выпеч|десерт|блин|оладь/i, 'fresh homemade cake or pastry on a wooden kitchen table, warm light, appetizing close-up'],
    [/суп|борщ|окрошк|бульон/i, 'bowl of hot homemade soup on kitchen table, steam visible, rustic spoon nearby'],
    [/салат/i, 'colorful fresh vegetable salad in a ceramic bowl on kitchen counter'],
    [/шашлык|гриль|мяс|котлет|фарш/i, 'grilled meat or patties on a plate, home kitchen background, appetizing food photo'],
    [/рыб/i, 'cooked fish dish on white plate, lemon garnish, home kitchen setting'],
    [/каша|завтрак/i, 'bowl of porridge with berries on breakfast table, morning kitchen light'],
    [/напит|коктейл|смузи/i, 'glass of homemade drink on kitchen counter, fresh ingredients nearby'],
    [/заготов|консерв|варень/i, 'glass jars with homemade preserves on kitchen table'],
    [/овощ|капуст|тушен/i, 'stewed vegetables in a pan on stove, home cooking scene'],
  ];
  for (const [pattern, scene] of scenes) {
    if (pattern.test(t)) return scene;
  }
  return 'homemade cooked dish on a plate in a modest Russian kitchen, appetizing food photography';
}

export function photoRealismWrapper(sceneDescription) {
  return [
    sceneDescription,
    'Must look like an unedited candid photograph of real food, NOT illustration, NOT digital art, NOT CGI.',
    'Shot on an old smartphone in a home kitchen: soft focus, natural indoor light, slight JPEG compression.',
    'Warm cozy tones, realistic food textures, steam or moisture where appropriate.',
    'Awkward framing, plate off-center, kitchen clutter in background.',
    'FORBIDDEN: text, letters, numbers, logos, watermarks, recipe cards with readable text.',
    'FORBIDDEN: stock photo perfection, studio lighting, AI gloss, painterly look.',
  ].join(' ');
}

async function openAiImageScene(apiKey, baseURL, model, provider, title, category, body) {
  const response = await withRetry(
    async () => {
      const client = new OpenAI({ apiKey, baseURL, timeout: API_TIMEOUT_MS, maxRetries: 0 });
      return client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SCENE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Заголовок: ${title}\nКатегория: ${category}\nСодержание: ${body.slice(0, 400) || title}`,
          },
        ],
        max_tokens: 180,
      });
    },
    { attempts: 3, label: `${provider} Image Prompt` },
  );
  return response.choices[0]?.message?.content?.trim();
}

export async function aiImageScene(title, category, body) {
  const userPrompt = `Заголовок: ${title}\nКатегория: ${category}\nСодержание: ${body.slice(0, 400) || title}`;

  if (isGeminiConfigured()) {
    try {
      const scene = await geminiGenerateText({ system: SCENE_SYSTEM_PROMPT, user: userPrompt });
      if (scene && scene.length > 40) {
        console.log(`  [Gemini Image Prompt] ${scene.slice(0, 70)}…`);
        return scene;
      }
    } catch (err) {
      console.warn(`  [Gemini Image Prompt] ${err.message}`);
    }
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const textProviders = [];
  if (deepseekKey && deepseekKey !== 'sk-...') {
    textProviders.push({
      provider: 'DeepSeek',
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
    });
  }
  if (openaiKey && openaiKey !== 'sk-...') {
    textProviders.push({ provider: 'OpenAI', apiKey: openaiKey, model: 'gpt-4o-mini' });
  }

  for (const { provider, apiKey, baseURL, model } of textProviders) {
    try {
      const scene = await openAiImageScene(apiKey, baseURL, model, provider, title, category, body);
      if (scene && scene.length > 40) {
        console.log(`  [${provider} Image Prompt] ${scene.slice(0, 70)}…`);
        return scene;
      }
    } catch (err) {
      console.warn(`  [${provider} Image Prompt] ${err.message}`);
    }
  }

  return null;
}

export async function buildImagePrompt(title, category, body = '') {
  const aiScene = await aiImageScene(title, category, body);
  const scene = aiScene || extractSceneFromTitle(`${title} ${body}`);
  return photoRealismWrapper(scene);
}
