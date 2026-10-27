# Деплой smenabcn.com на Cloudflare Pages

Пометки: **[вы]** — делаете в своих аккаунтах (логины, ключи, оплата), **[я]** — делаю в коде.

## 1. Cloudflare и домен

1. **[вы]** Зарегистрироваться на dash.cloudflare.com (бесплатный план).
2. **[вы]** Add a domain → `smenabcn.com` → план Free. Cloudflare покажет 2 NS-сервера.
3. **[вы]** У регистратора, где куплен домен, заменить NS на эти два. Обновление занимает от 10 минут до суток, Cloudflare пришлёт письмо, когда домен станет Active.
4. **[вы]** Если у регистратора включён DNSSEC — выключить до смены NS.

## 2. Репозиторий

1. **[вы]** Создать на GitHub пустой приватный репозиторий (без README), прислать мне ссылку.
2. **[я]** Первый коммит и пуш в `main`.

## 3. Проект Pages

1. **[вы]** Workers & Pages → Create → внизу «Looking to deploy Pages? Get started» (или https://dash.cloudflare.com/?to=/:account/pages/new/provider/github) → Import an existing Git repository. Не путать с мастером Workers: если на экране есть поле «Deploy command», это не тот мастер.
2. **[вы]** Настройки сборки:
   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Версию Node берёт из `.nvmrc` (22), ничего задавать не нужно.
3. **[вы]** Save and Deploy. Через 1–2 минуты сайт откроется на `smenabcn.pages.dev`.
4. **[вы]** В проекте → Custom domains → Set up a custom domain → `smenabcn.com`. DNS-запись Cloudflare создаст сам.
5. **[вы]** www → корень: Rules → Redirect Rules → шаблон «Redirect from WWW to root». Шаблон сам подскажет, какую DNS-запись для `www` добавить.

После этого сайт уже работает, но заявки никуда не доходят: функция ответит `502`, а форма предложит написать в WhatsApp.

## 4. Telegram (уведомления о заявках)

1. **[вы]** В @BotFather → `/newbot` → получить токен.
2. **[вы]** Создать группу, включить в ней «Темы» (Topics), создать две темы: «Бизнес» и «Соискатели». Добавить бота в группу админом.
3. **[вы]** Написать по сообщению в каждую тему, затем открыть в браузере (подставив свой токен):
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates`
   В ответе найти `"chat":{"id":-100…}` — это `TELEGRAM_CHAT_ID`, и `message_thread_id` для каждой темы — это `TG_THREAD_BUSINESS` и `TG_THREAD_CANDIDATE`. Токен мне присылать не нужно, ID тем можно.

## 5. Google Sheets (таблица заявок)

1. **[вы]** Создать таблицу → Расширения → Apps Script → вставить код из [docs/apps-script.gs](docs/apps-script.gs).
2. **[вы]** Настройки проекта (шестерёнка) → Свойства скрипта → `WEBHOOK_SECRET` = любая длинная случайная строка.
3. **[вы]** Начать развёртывание → Веб-приложение → «Выполнять от имени: я», «Доступ: все» → скопировать URL.

## 6. Turnstile (антиспам)

1. **[вы]** Cloudflare → Turnstile → Add widget → режим Managed, домены `smenabcn.com` и `smenabcn.pages.dev`.
2. **[вы]** Прислать мне **Site Key** (он публичный). **Secret Key** оставить у себя.
3. **[я]** Зашить Site Key в сборку и запушить.

Порядок важен: сначала деплой с Site Key, потом Secret в переменных. Если сервер получит секрет раньше, чем на сайте появится виджет, все заявки будут отклоняться.

## 7. Переменные окружения

**[вы]** Pages → проект → Settings → Variables and Secrets → Production → тип **Secret**:

| Переменная | Откуда |
|---|---|
| `TELEGRAM_BOT_TOKEN` | шаг 4.1 |
| `TELEGRAM_CHAT_ID` | шаг 4.3 |
| `TG_THREAD_BUSINESS` | шаг 4.3 |
| `TG_THREAD_CANDIDATE` | шаг 4.3 |
| `SHEETS_WEBHOOK_URL` | шаг 5.3 |
| `SHEETS_WEBHOOK_SECRET` | та же строка, что в шаге 5.2 |
| `TURNSTILE_SECRET` | шаг 6.1, после деплоя с Site Key |

После сохранения — Deployments → последний → Retry deployment, чтобы переменные подхватились.

## 8. Лимит заявок (по желанию)

Без KV лимит 5 заявок / 10 мин / IP считается внутри одного инстанса — для старта достаточно.

1. **[вы]** Workers & Pages → KV → Create namespace `smena-rate-limit` → прислать мне его ID.
2. **[я]** Раскомментировать блок `RATE_LIMIT` в `wrangler.toml` и запушить.

## 9. Почта hello@smenabcn.com

**[вы]** Домен → Email → Email Routing → включить → правило `hello@` → переслать на ваш Gmail. Бесплатно, DNS-записи Cloudflare добавит сам. Это только приём; чтобы отвечать с этого адреса, нужен отдельный почтовый сервис (Zoho Free, Google Workspace).

## 10. Проверка

**[я]** На боевом домене: отправить по тестовой заявке бизнеса и соискателя, проверить сообщения в обеих темах Telegram и строки в таблице, ответ `429` на 6-ю заявку подряд, Lighthouse, OG-превью ссылки в Telegram/WhatsApp, `sitemap-index.xml`.

**[вы]** Google Search Console → добавить ресурс `smenabcn.com` (подтверждение через DNS в Cloudflare) → отправить `https://smenabcn.com/sitemap-index.xml`.
