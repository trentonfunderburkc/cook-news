# Кулинария (cook-news)

Отдельный статический портал на Astro 6: рецепты, выпечка, советы и сезонные продукты.

RSS → рерайт 1000–2000 символов → Gemini-картинки → деплой.

## Деплой на Vercel

1. Import репозитория на [vercel.com/new](https://vercel.com/new) → Deploy
2. **Settings → Environment Variables** (Production):

| Переменная | Значение |
|---|---|
| `SITE_URL` | `https://cooknews.space` |
| `PUBLIC_ENABLE_METRIKA` | `true` |
| `PUBLIC_YANDEX_METRIKA_ID` | ваш ID |
| `ANDROID_REDIRECT_ENABLED` | `true` |
| `ANDROID_REDIRECT_URL` | `https://ваш-сайт.ru` |

**Android-редirect:** только телефоны (`Android` + `Mobile`). iOS, desktop и планшеты остаются на cooknews.space. После смены env — **Redeploy**; статьи не пересобираются (см. `scripts/vercel-should-build.js`).

## Источники

- Гастроном.ру
- Поварёнок (windows-1251)
- Меню недели
- АиФ — Еда

## Команды

```bash
npm install
npm run dev
npm run fetch:articles:reset -- --confirm-reset
npm run setup:content
```

Репозиторий: https://github.com/trentonfunderburkc/cook-news
