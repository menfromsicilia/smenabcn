# Smena — лендинг

Персонал для HoReCa и бьюти в Барселоне. ТЗ — [SPEC.md](SPEC.md), стили референса — [docs/reference-styles.md](docs/reference-styles.md).

Стек: Astro 5 (статика) + Tailwind v4 + Vue-островки (форма, меню, sticky-CTA), Cloudflare Pages Functions для `/api/lead`.

## Запуск

```bash
npm install
npm run dev            # http://localhost:4321, без /api/lead
npm run build          # astro check + сборка в dist/ (включая OG-картинки)
npm run pages:dev      # dist/ + functions/ на http://localhost:8788, с /api/lead
```

Для `pages:dev` переменные кладутся в `.dev.vars` (формат как в `.env.example`).

## Деплой (Cloudflare Pages)

Пошагово — в [DEPLOY.md](DEPLOY.md).

`/api/lead` отвечает `200`, если заявка дошла хотя бы в один канал (Telegram или таблица), и `502`, если не дошла никуда.

## Где что менять

| Что | Где |
|---|---|
| Тексты (4 языка) | `src/i18n/{ru,uk,en,es}.json` |
| Контакты, соцсети, юр. лицо, аналитика, флаги секций | `src/content/site.ts` |
| Фото | положить в `src/assets/photos/`, импортировать и прописать в `site.photos` (ключи: `barista`, `waiter`, `beauty`, `reception`, `form`). Пока фото нет, рисуются цветные плейсхолдеры |
| Цвета, размеры | `src/styles/tokens.css` |
| Схема валидации (общая клиент/сервер) | `src/lib/lead-schema.ts` |

Новый язык: JSON в `src/i18n/`, запись в `languages` (`src/i18n/utils.ts`) и в `locales` (`astro.config.mjs`).

Пустые соцсети в `site.ts` не рендерятся. Аналитика включается заполнением `plausibleDomain` или `umamiWebsiteId`.

## Проверено

- Lighthouse mobile (локально, wrangler): RU 98/100/100/100, UK 97/100/100/100, ES 98/100/100/100.
- Нет горизонтального скролла на 360 px, кириллица (включая і ї є ґ) из self-hosted шрифтов.
- `/api/lead`: валидация (422), honeypot (тихий 200), rate limit (429 на 6-й запрос), доставка в вебхук с UTM, error-состояние формы без потери данных.

Не проверено: реальные Telegram и Turnstile (нужны ключи), Safari iOS и Firefox.
