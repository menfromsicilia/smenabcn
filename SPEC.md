# ТЗ: Лендинг HR-агентства «Smena»: подбор персонала для HoReCa и бьюти, Барселона

> Документ рассчитан на реализацию в Claude Code. Положи его в корень репозитория как `SPEC.md` и ссылайся на него в промптах.

---

## 0. Цель и метрики

**Цель страницы:** получить заявку от владельца или управляющего кафе, ресторана или салона красоты в Барселоне.
**Вторичная цель:** собрать базу соискателей.

| Метрика | Цель |
|---|---|
| Основная конверсия | отправка формы «Заявка бизнеса» |
| Микроконверсии | клик по WhatsApp, клик по «Я ищу работу», отправка формы соискателя, скролл до формы |
| Lighthouse (mobile) | Performance ≥ 95, Accessibility ≥ 95, SEO 100 |
| LCP | < 2.0 s на 4G |

**Главный принцип:** весь трафик почти целиком мобильный, потому что владельцы заходят из Instagram и WhatsApp. Поэтому mobile-first, CTA всегда в зоне большого пальца, форма без лишних полей.

---

## 1. Нейминг и позиционирование

### Название категории
Не «HR-агентство», а **«Staff для гостеприимства и красоты»**:
- RU: **Персонал для HoReCa и бьюти**
- UK: **Персонал для HoReCa та б'юті**
- EN: **Hospitality & Beauty Staffing**
- ES: **Personal para hostelería y belleza**

Четыре направления (используются в блоке 2 и в селекте формы):

| Ключ | ES | RU | Роли внутри |
|---|---|---|---|
| `floor` | Sala y barra | Зал и бар | camareros, bartenders, runners, ayudantes de sala |
| `coffee` | Cafeterías | Кофейни | baristas, dependientes, ayudantes |
| `front` | Recepción y gestión | Администраторы и менеджеры | recepcionistas, hostess, encargados, gerentes |
| `beauty` | Belleza | Мастера красоты | peluqueros, barberos, manicuristas, esteticistas, maquilladores |

### Бренд
**Smena** (от слова «смена»). Русско- и украиноязычная аудитория понимает его без перевода, а испанцы и англоязычные нормально читают латиницу.
- Логотип: wordmark `Smena` + маленький бейдж `BCN`
- Дескриптор под лого (локализуется): *Персонал для HoReCa и бьюти · Барселона*
- Домены для проверки: `smena.barcelona`, `smenabcn.com`, `smena-staff.es`

### Tone of voice
Уверенно, коротко, без канцелярита. RU и UK на «вы» (это B2B), ES на «tú» (в местной HoReCa так принято), EN нейтрально. Обещания конкретные: цифры 7 дней, 48 часов, 30 дней.

---

## 2. Языки

| Код | Язык | URL | Метка в переключателе |
|---|---|---|---|
| `ru` | Русский, **основной** | `/` | RU |
| `uk` | Украинский | `/uk/` | UA |
| `en` | Английский | `/en/` | EN |
| `es` | Испанский | `/es/` | ES |

- Код украинского по ISO 639-1 `uk`, а не `ua`. Он используется в `lang`, `hreflang` и именах файлов. В интерфейсе показываем «UA», так привычнее.
- Переключатель есть в хедере и футере. При переключении пользователь остаётся на той же секции (hash сохраняется).
- Язык по браузеру автоматически не определяется, редиректов нет (так лучше для SEO). Опционально: ненавязчивая плашка «Есть версия на испанском →», если `navigator.language` начинается с `es`.
- `hreflang` на всех версиях, `x-default` → `/` (RU).
- Тексты сначала пишутся на RU, затем переводятся на UK, EN и ES. Переводы вычитывает носитель, особенно испанский: его читают местные владельцы.
- Архитектура позволяет добавить новый язык (например, каталанский) одной папкой и одним JSON.

---

## 3. Стек

| Что | Решение | Почему |
|---|---|---|
| Фреймворк | **Astro 5** + TypeScript | статика, 0 KB JS по умолчанию, встроенный i18n-роутинг |
| Стили | **Tailwind CSS v4** + CSS-переменные для токенов | быстро, токены в одном месте |
| Интерактив | островки на **Vue 3** (`@astrojs/vue`): форма, мобильное меню, аккордеон FAQ | привычный стек |
| Валидация | `zod` + `libphonenumber-js` (дефолтная страна ES) | — |
| Шрифты | `@fontsource-variable/playfair-display`, `@fontsource-variable/inter-tight` (self-host, сабсеты latin + cyrillic) | без запросов к Google, GDPR, кириллица |
| Иконки | `lucide` (SVG inline) | — |
| Анимации | CSS + `IntersectionObserver`, без библиотек | вес |
| Обработка форм | серверная функция (Netlify Functions / Vercel / Cloudflare Pages Functions) → **Telegram-бот** + **Google Sheets** (через Apps Script webhook) | заявка сразу у менеджера в телефоне + таблица как CRM |
| Хостинг | Cloudflare Pages или Netlify | бесплатно, CDN в EU |
| Аналитика | **Plausible** или **Umami** (cookieless) + Meta Pixel только после согласия | cookieless позволяет обойтись без cookie-баннера для базовой аналитики |
| Антиспам | honeypot-поле + Cloudflare Turnstile (invisible) | без капчи-мучения |

Контент (тексты, роли, контакты) хранится в `src/i18n/{ru,uk,en,es}.json` и `src/content/site.ts`, а не в разметке.

---

## 4. Визуальный стиль

### Референс
https://www.rowcreative.co/premium-squarespace-template (шаблон «Anna» от Row Creative)

**Задача для Claude Code перед вёрсткой:**
1. Открыть референс в браузере пользователя (Claude in Chrome).
2. Пройти страницу целиком на desktop (1440) и mobile (390), снять скриншоты ключевых секций.
3. Через DevTools и `getComputedStyle` выписать фактические значения: шрифты, размеры и межстрочные интервалы, цвета, радиусы, отступы секций, стили кнопок, hover-эффекты, анимации.
4. Сохранить результат в `docs/reference-styles.md` и по нему обновить `src/styles/tokens.css`.

Токены и типографика ниже в этом разделе — стартовая гипотеза. Где референс с ними расходится, побеждает референс, с поправкой на контраст WCAG AA и поддержку кириллицы.

Ожидаемый подход, который надо подтвердить или поправить по референсу, — **bold colorful minimalism**:
- светлый тёплый фон и крупные контрастные цветные плашки-секции;
- крупная выразительная антиква в заголовках, рядом спокойный гротеск;
- маленькие uppercase-лейблы («eyebrow») над заголовками;
- кнопки-пилюли, скругления, «стикеры» и бейджи поверх фото;
- фото в скруглённых карточках, местами повёрнутые на 2–4°, как полароиды;
- много воздуха, мало элементов на экране, один акцент на блок;
- бегущая строка (marquee) как разделитель секций.

Копируем стилистику (типографику, ритм, цвета, компоненты), но не тексты, фото и графику референса.

### Цветовые токены

```css
:root {
  --bg:        #F6F0E6; /* тёплый крем, основной фон */
  --surface:   #FFFFFF;
  --ink:       #1C1A17; /* основной текст, тёмные кнопки */
  --ink-soft:  #5B554C; /* вторичный текст */
  --tomato:    #E8553A; /* главный акцент: бар, энергия */
  --blush:     #F3B8C4; /* бьюти */
  --butter:    #F5D76E; /* кофе, подсветки */
  --olive:     #2F4A3A; /* тёмная секция, доверие */
  --line:      #1C1A1720;
  --radius-lg: 28px;
  --radius-md: 18px;
  --radius-pill: 999px;
}
```

Правила контраста (WCAG AA):
- на `--tomato`, `--blush` и `--butter` текст только `--ink`;
- на `--olive` и `--ink` текст `--bg`;
- белый текст на томатном фоне запрещён (контраст < 4.5).

Тёмная тема не нужна, страница всегда светлая. Это сознательное решение по бренду.

### Типографика

| Роль | Шрифт | Desktop | Mobile |
|---|---|---|---|
| H1 | Playfair Display, 700, `letter-spacing: -0.02em` | 88/0.95 | 44/1.0 |
| H2 | Playfair Display, 500 | 56/1.05 | 34/1.1 |
| H3 | Inter Tight, 600 | 24/1.25 | 20/1.3 |
| Body | Inter Tight, 400 | 18/1.55 | 16/1.55 |
| Eyebrow | Inter Tight, 600, uppercase, `letter-spacing: .12em` | 13 | 12 |
| Кнопки | Inter Tight, 600 | 17 | 16 |

Акцентное слово в H1/H2 набирается курсивом Playfair Display (`font-style: italic`) и подсвечивается цветом: например, *7 дней* в томатном цвете.

**Кириллица обязательна.** Все шрифты должны поддерживать русский и украинский, включая і, ї, є, ґ. Если у шрифта референса нет кириллицы, подобрать ближайший по характеру шрифт с кириллицей:
- для заголовков: Playfair Display, Cormorant, Lora, Literata;
- для текста: Inter Tight, Manrope.

Русские и украинские заголовки длиннее испанских, поэтому:
- переносы H1 проверить на 360 px;
- использовать `text-wrap: balance` и `hyphens: auto` с правильным `lang`.

### Компоненты
- **Button primary:** `--ink` фон, `--bg` текст, пилюля, высота 56 px (mobile 52), hover: сдвиг вверх на 2 px и стрелка → смещается.
- **Button secondary:** прозрачный фон, обводка 1.5 px `--ink`, hover: заливка `--butter`.
- **Badge/Sticker:** круг 110 px, текст по кругу (SVG `textPath`), медленно вращается (20 s, `prefers-reduced-motion` → стоп). Например: «ОПЛАТА ЗА РЕЗУЛЬТАТ ·».
- **Card:** `--surface`, `--radius-lg`, padding 32, без теней или с очень мягкой тенью `0 1px 0 var(--line)`.
- **Marquee:** полоса 64 px, фон `--ink`, текст `--bg`, повторяет роли (локализуется): `ОФИЦИАНТЫ ✦ БАРИСТА ✦ АДМИНИСТРАТОРЫ ✦ ПАРИКМАХЕРЫ ✦ МАСТЕРА МАНИКЮРА ✦ БАРМЕНЫ ✦`.

### Сетка
- Контейнер max 1240 px, боковые поля 20 px (mobile), 40 px (desktop).
- 12 колонок, gap 24.
- Вертикальный ритм секций: 120 px desktop, 72 px mobile.

### Фото
- Стиль: живые, тёплые, естественный свет, люди в работе (бариста за машиной, официант с подносом, мастер маникюра, администратор за стойкой). Никакого корпоративного стока «люди в костюмах жмут руки».
- На старте можно брать Unsplash или Pexels (проверить лицензию), потом заменить на собственную съёмку.
- Формат AVIF/WebP через `astro:assets`, `loading="lazy"` везде, кроме hero.
- Hero-изображение не тяжелее 120 KB.

### Анимации
- Появление блоков: `opacity 0→1` + `translateY 16px→0`, 500 ms, stagger 60 ms.
- Шаги процесса: линия между шагами прорисовывается при скролле.
- Всё отключается при `prefers-reduced-motion: reduce`.

---

## 5. Структура страницы и контент

Порядок: **Header → 1 Hero → Marquee → 2 Кого подбираем → 3 Как работаем → 4 Форма → 5 Контакты/Footer.**
Плюс глобально: sticky-CTA на мобиле и плавающая кнопка WhatsApp.

Ниже тексты на RU (основной) и ES. Версии на UK и EN переводятся с RU и вычитываются носителем.

---

### Header (sticky)
- Слева лого `Smena` + бейдж `BCN`.
- Справа (desktop): якоря `Кого подбираем` · `Как работаем` · `Контакты`, переключатель `RU / UA / EN / ES`, кнопка primary **«Оставить заявку»** → `#form`.
- Mobile: лого, переключатель языка, бургер. Меню открывается на весь экран с фоном `--butter`.
- При скролле > 40 px появляется фон `--bg` с blur и тонкая нижняя линия.

---

### Блок 1: Hero `#top`

**Layout desktop:** две колонки 7/5. Слева текст, справа коллаж из трёх скруглённых фото (бариста, официант, мастер красоты), слегка повёрнутых, с вращающимся стикером поверх.
**Layout mobile:** сначала текст, потом коллаж (2 фото), кнопки на всю ширину друг под другом.

| | ES | RU |
|---|---|---|
| Eyebrow | Personal para hostelería y belleza · Barcelona | Персонал для HoReCa и бьюти · Барселона |
| H1 | Cubrimos la vacante de tu cafetería, restaurante o salón en *7 días* | Закроем вакансию в вашем кафе, ресторане или салоне за *7 дней* |
| Подзаголовок | Camareros, baristas, recepcionistas y profesionales de belleza verificados en Barcelona. Solo pagas por resultado. | Проверенные официанты, бариста, администраторы и мастера красоты в Барселоне. Платите только за результат. |
| CTA 1 (primary) | Solicitar personal → | Оставить заявку → |
| CTA 2 (secondary) | Busco trabajo | Я ищу работу |
| Стикер | PAGAS SOLO POR RESULTADO · | ОПЛАТА ЗА РЕЗУЛЬТАТ · |

Под кнопками три мини-факта в строку с иконками:
`48 h — primeros candidatos` · `30 días — sustitución gratis` · `0 € — por adelantado`
(RU: `48 ч — первые кандидаты` · `30 дней — бесплатная замена` · `0 € — предоплаты`)

Поведение:
- CTA 1 → скролл к `#form`, форма бизнеса.
- CTA 2 → скролл к `#form`, сразу открывается мини-форма соискателя (см. блок 4).

---

### Marquee
Бегущая строка с ролями (см. компоненты). Декоративная, `aria-hidden="true"`.

---

### Блок 2: Кого подбираем `#perfiles`

| | ES | RU |
|---|---|---|
| Eyebrow | Qué perfiles cubrimos | Кого подбираем |
| H2 | Todo el equipo, *de la barra al sillón* | Вся команда, *от бара до кресла мастера* |

**Четыре карточки** в сетке 2×2 (desktop) / 1 колонка со scroll-snap-каруселью (mobile). Каждая карточка своего цвета: `floor` → tomato, `coffee` → butter, `front` → surface с обводкой, `beauty` → blush.

Содержимое карточки:
- номер `01`–`04` (Playfair Display italic, крупно);
- название направления (H3);
- список ролей через `·`;
- фото-кружок 96 px в углу;
- ссылка «Solicitar →», которая скроллит к форме и **предзаполняет селект «Кого ищете»** этим направлением.

| # | ES заголовок | ES роли | RU заголовок | RU роли |
|---|---|---|---|---|
| 01 | Sala y barra | Camareros · Bartenders · Runners · Ayudantes de sala | Зал и бар | Официанты · Бармены · Раннеры · Помощники |
| 02 | Cafeterías | Baristas · Dependientes · Ayudantes | Кофейни | Бариста · Продавцы · Помощники |
| 03 | Recepción y gestión | Recepcionistas · Hostess · Encargados · Gerentes | Администраторы и менеджеры | Администраторы · Хостес · Управляющие · Менеджеры |
| 04 | Belleza | Peluqueros · Barberos · Manicuristas · Esteticistas | Мастера красоты | Парикмахеры · Барберы · Мастера маникюра · Косметологи |

---

### Блок 3: Как работаем `#proceso`

Фон секции `--olive`, текст `--bg`. Это самая контрастная и запоминающаяся секция страницы.

| | ES | RU |
|---|---|---|
| Eyebrow | Cómo trabajamos | Как работаем |
| H2 | Cuatro pasos. *Sin sorpresas.* | Четыре шага. *Без сюрпризов.* |

**Шаги** (desktop: 4 колонки с соединительной линией; mobile: вертикальный таймлайн):

| # | ES | ES пояснение | RU | RU пояснение |
|---|---|---|---|---|
| 1 | Solicitud | Nos cuentas qué perfil necesitas. 2 minutos. | Заявка | Рассказываете, кто нужен. 2 минуты. |
| 2 | Candidatos en 48 h | Te enviamos perfiles ya entrevistados y verificados. | Кандидаты за 48 часов | Присылаем уже проверенных и прособеседованных. |
| 3 | Tú eliges | Haces la prueba o entrevista con quien te encaje. | Вы выбираете | Проводите пробную смену или собеседование. |
| 4 | Empieza a trabajar | El nuevo miembro del equipo se incorpora. | Сотрудник выходит | Новый человек выходит на смену. |

Под шагами две плашки-гарантии (фон `--butter`, текст `--ink`, иконки):
- **Solo pagas por resultado** / **Оплата только за результат**: «Si no contratas, no pagas nada.» / «Не наняли — ничего не платите.»
- **Sustitución gratis 30 días** / **Бесплатная замена 30 дней**: «Si la persona no encaja en el primer mes, buscamos otra sin coste.» / «Если человек не подошёл в первый месяц, найдём замену бесплатно.»

CTA под блоком: primary-кнопка в инверсии (фон `--bg`) **«Empezar ahora»** / **«Начать»** → `#form`.

---

### Блок 4: Форма `#form`

**Layout desktop:** две колонки. Слева заголовок, буллеты «что будет дальше» и фото; справа карточка формы (`--surface`, большой радиус).
**Mobile:** заголовок, затем форма.

| | ES | RU |
|---|---|---|
| Eyebrow | Solicitud | Заявка |
| H2 | ¿A quién necesitas? *Te respondemos hoy.* | Кто вам нужен? *Ответим сегодня.* |
| Буллеты слева | ✓ Te escribimos por WhatsApp en menos de 2 horas (L–S, 9–20 h) · ✓ Sin compromiso ni pago por adelantado · ✓ Primeros candidatos en 48 h | ✓ Напишем в WhatsApp в течение 2 часов (Пн–Сб, 9–20) · ✓ Без обязательств и предоплаты · ✓ Первые кандидаты за 48 часов |

#### 4.1. Форма бизнеса (основная)

| Поле | name | Тип | Обяз. | ES label / placeholder | RU label / placeholder | Валидация |
|---|---|---|---|---|---|---|
| Имя | `name` | text | да | Tu nombre / Ana | Ваше имя / Анна | 2–60 символов |
| Бизнес | `business` | text | да | Nombre del negocio / Café Gràcia | Название бизнеса / Café Gràcia | 2–80 |
| Кого ищете | `role` | select | да | ¿A quién buscas? | Кого ищете? | одно из `floor/coffee/front/beauty/other` |
| WhatsApp | `whatsapp` | tel | да | WhatsApp / +34 600 000 000 | WhatsApp / +34 600 000 000 | `libphonenumber-js`, дефолт ES, допускаются любые страны |
| Согласие | `consent` | checkbox | да | Acepto la [política de privacidad] | Согласен с [политикой конфиденциальности] | true |
| Honeypot | `company_site` | text, скрыто | — | — | — | должно быть пустым |

Опции селекта: `Sala y barra`, `Cafetería / barista`, `Recepción y gestión`, `Belleza`, `Otro`. Если пришли из карточки блока 2, опция уже выбрана.

Кнопка: **«Enviar solicitud»** / **«Отправить»**, на всю ширину карточки, primary.

Скрытые поля, которые подставляются автоматически: `lang`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `referrer`, `page_url`, `timestamp`.

**Состояния:**
- *idle* → *loading* (спиннер в кнопке, кнопка задизейблена) → *success* / *error*.
- **Success:** карточка формы заменяется экраном «¡Recibido! Te escribimos por WhatsApp en breve.» / «Заявка принята! Скоро напишем в WhatsApp.» + кнопка «Escribir ahora por WhatsApp», которая открывает `wa.me` с предзаполненным текстом.
- **Error:** «Algo ha fallado. Escríbenos directamente por WhatsApp» + та же кнопка. Введённые данные не теряются.
- Ошибки валидации показываются инлайн под полем после `blur`, а при submit делается фокус на первое невалидное поле.

#### 4.2. Строка для соискателей

Сразу под карточкой формы одна строка:

> ES: **¿Buscas trabajo?** Déjanos tu contacto y te escribiremos cuando haya una vacante. **[Dejar contacto]**
> RU: **Ищете работу?** Оставьте контакт, и мы напишем, когда появится вакансия. **[Оставить контакт]**

По клику строка раскрывается (accordion, без перехода на другую страницу) в мини-форму из одной строки на desktop и столбика на mobile:
`Имя` · `WhatsApp` · `Профессия` (select с теми же 4 направлениями) · `consent` · [Enviar].

Это отдельный тип лида: `type: "candidate"`. Он уходит в другой Telegram-топик и на другой лист таблицы. Кнопка «Я ищу работу» из hero открывает именно этот аккордеон.

#### 4.3. Бэкенд формы

`POST /api/lead` (serverless):
1. Проверить Turnstile-токен и honeypot.
2. Провалидировать тело тем же zod-схемой, что и на клиенте (схема в `src/lib/lead-schema.ts` общая).
3. Rate limit: 5 запросов в 10 минут на IP.
4. Параллельно:
   - отправить сообщение в Telegram (`sendMessage`, `parse_mode=HTML`, разные `message_thread_id` для business/candidate);
   - сделать POST в Google Apps Script webhook → дописать строку в лист `Leads` или `Candidates`.
5. Вернуть `200 {ok:true}` или `4xx/5xx {ok:false, error}`.

Шаблон сообщения в Telegram:
```
🟠 Новая заявка (RU)
👤 Ana — Café Gràcia
🎯 Sala y barra
📱 +34 600 000 000 → https://wa.me/34600000000
🔗 utm: instagram / cpc / hero_v1
```

ENV: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TG_THREAD_BUSINESS`, `TG_THREAD_CANDIDATE`, `SHEETS_WEBHOOK_URL`, `TURNSTILE_SECRET`, `PUBLIC_TURNSTILE_SITEKEY`, `PUBLIC_WHATSAPP_NUMBER`.

---

### Блок 5: Контакты и соцсети / Footer `#contacto`

Фон `--ink`, текст `--bg`. Огромный wordmark `Smena` на всю ширину внизу (Playfair Display, ~22vw, обрезан снизу), как в референсе.

Содержимое (3 колонки desktop / стек mobile):
1. **Контакты:**
   - WhatsApp: `+34 XXX XXX XXX` (ссылка `wa.me`)
   - Email: `hello@smena.barcelona`
   - Часы: Пн–Сб 9:00–20:00
   - Зона работы: Барселона и пригороды (без точного адреса, если нет офиса)
2. **Соцсети** (иконки-кружки 44 px): Instagram, TikTok, LinkedIn, Telegram. Ссылки в конфиге, а пустые не рендерятся.
3. **Навигация:** якоря страницы + юридические ссылки (локализуются): Правовая информация · Политика конфиденциальности · Политика cookies.

Нижняя строка: `© 2026 Smena · [юр. лицо / NIF]` · переключатель языка.

---

### Глобальные элементы
- **Плавающая кнопка WhatsApp:** справа снизу, 56 px. На mobile она поднимается над sticky-CTA. Ссылка `https://wa.me/<number>?text=<предзаполненный текст на языке страницы>`. Текст RU: «Здравствуйте, нужен сотрудник для моего бизнеса». Для остальных языков текст берётся из i18n.
- **Sticky CTA (только mobile):** нижняя панель с кнопкой «Оставить заявку». Появляется после ухода hero из вьюпорта и скрывается, когда форма `#form` в зоне видимости.
- **Плавный скролл** к якорям с учётом высоты хедера (`scroll-margin-top`).

---

## 6. Рекомендации к блокам (опционально, фаза 2)

Это не входит в обязательный объём, но заметно поднимет конверсию продающего лендинга:
1. **FAQ** перед формой (accordion, 5–6 вопросов): сколько стоит, что значит «оплата за результат», как проверяете кандидатов, что если сотрудник уйдёт, работаете ли с временными сменами, есть ли кандидаты с NIE и правом на работу. Плюс разметка `FAQPage` schema.
2. **Отзывы и логотипы клиентов:** только реальные, с разрешения клиентов. Выдуманные отзывы не публикуем (это и этически неправильно, и запрещено законом о защите потребителей). Пока отзывов нет, секцию не показываем.
3. **Цифры доверия:** «X вакансий закрыто», «Y кандидатов в базе», но только когда есть реальные данные.
4. **Прайс-блок:** «от X € / % от первой зарплаты», если модель готова к публикации.

Компоненты сразу делать так, чтобы эти секции подключались флагом в `site.ts`.

---

## 7. SEO

- `<title>` RU: `Персонал для кафе, ресторанов и салонов в Барселоне за 7 дней | Smena`
- `description` RU: `Проверенные официанты, бариста, администраторы и мастера красоты в Барселоне. Кандидаты за 48 часов, оплата только за результат.`
- `<title>` ES: `Personal para hostelería y belleza en Barcelona en 7 días | Smena`
- `description` ES: `Camareros, baristas, recepcionistas y profesionales de belleza verificados en Barcelona. Candidatos en 48 h, solo pagas por resultado.`
- UK и EN: по аналогии.
- `hreflang`: ru / uk / en / es, `x-default` → `/` (ru).
- Ключи RU/UK: *подбор персонала Барселона*, *найти официанта в Барселоне*, *бариста Барселона*, *администратор салона Барселона*, *кадровое агентство Барселона*.
- Canonical на каждой версии.
- OG-картинка 1200×630 на каждый язык (генерировать на билде через `satori` или положить статикой).
- Schema.org: `EmploymentAgency` (name, areaServed: Barcelona, telephone, sameAs → соцсети), позже `FAQPage`.
- `sitemap.xml` (`@astrojs/sitemap`), `robots.txt`.
- Один H1 на страницу, логичная иерархия H2/H3.
- Ключи ES: *empresa de selección de personal hostelería Barcelona*, *buscar camareros Barcelona*, *contratar barista Barcelona*, *personal para peluquería Barcelona*, *agencia de recepcionistas Barcelona*.

---

## 8. Аналитика и события

Plausible/Umami custom events:

| Событие | Когда |
|---|---|
| `cta_hero_business` | клик «Solicitar personal» в hero |
| `cta_hero_candidate` | клик «Busco trabajo» |
| `card_role_click` | клик в карточке блока 2, props: `role` |
| `form_start` | первый фокус в форме бизнеса |
| `lead_business` | успешная отправка, props: `role`, `lang` |
| `lead_candidate` | успешная отправка формы соискателя |
| `whatsapp_click` | клик по любой WA-ссылке, props: `placement` |
| `form_error` | ошибка сервера |

Meta Pixel и Google Ads (если будет реклама) загружаются **только после согласия** в cookie-баннере. Пока их нет, баннер не нужен.

UTM сохраняются в `sessionStorage` при входе и подставляются в форму.

---

## 9. Юридическое (Испания: RGPD + LSSI)

Обязательно к запуску:
- Юр. страницы публикуются на всех четырёх языках с одинаковыми slug в каждой языковой папке. Испанская версия обязательна и юридически приоритетна, об этом нужна пометка на остальных языках.
- **Aviso legal** (`/legal`): реквизиты владельца (имя/компания, NIF, адрес, email).
- **Política de privacidad** (`/privacy`): кто обрабатывает данные, цель (связь по заявке, база кандидатов), срок хранения, права ARSULIPO, контакт.
- **Política de cookies** (`/cookies`).
- Чекбокс согласия в каждой форме, **не отмеченный по умолчанию**.
- Под кнопкой формы мелким шрифтом короткая «información básica de protección de datos» (responsable, finalidad, derechos).
- Для соискателей отдельная цель обработки: хранение в базе кандидатов, срок 12 месяцев.

Тексты юр. страниц: шаблоны-плейсхолдеры `[NOMBRE]`, `[NIF]` и т.д. Финальные тексты должен проверить юрист или gestor.

---

## 10. Доступность и качество

- Семантика: `header`, `main`, `section[aria-labelledby]`, `footer`, `nav`.
- Все интерактивные элементы доступны с клавиатуры, видимый `:focus-visible` (outline 3 px `--tomato`).
- Лейблы у всех полей, ошибки связаны через `aria-describedby`, статус отправки объявляется через `aria-live="polite"`.
- Touch-target ≥ 44 px.
- `prefers-reduced-motion` уважается.
- Проверка в Safari iOS, Chrome Android, Chrome/Firefox/Safari desktop.
- Брейкпоинты: 360, 390, 768, 1024, 1280, 1440. Горизонтального скролла нет ни на одном.

---

## 11. Структура проекта

```
/
├─ SPEC.md                      ← этот документ
├─ docs/reference-styles.md     ← стили, снятые с референса (раздел 4)
├─ astro.config.mjs             ← i18n: ru (default, без префикса), uk, en, es
├─ src/
│  ├─ content/site.ts           ← контакты, соцсети, флаги секций, WA-номер
│  ├─ i18n/{ru,uk,en,es}.json      ← все тексты
│  ├─ i18n/utils.ts             ← t(), getLangFromUrl()
│  ├─ lib/lead-schema.ts        ← zod-схема (общая клиент/сервер)
│  ├─ styles/tokens.css         ← CSS-переменные из раздела 4
│  ├─ components/
│  │  ├─ Header.astro  LangSwitch.astro  MobileMenu.vue
│  │  ├─ Hero.astro  Sticker.astro  Marquee.astro
│  │  ├─ Roles.astro  RoleCard.astro
│  │  ├─ Process.astro  Guarantee.astro
│  │  ├─ LeadForm.vue  CandidateForm.vue  FormSection.astro
│  │  ├─ Footer.astro  WhatsAppFab.astro  StickyCta.vue
│  │  └─ ui/Button.astro  Badge.astro
│  ├─ layouts/Base.astro        ← meta, hreflang, schema, шрифты
│  └─ pages/
│     ├─ index.astro  legal.astro  privacy.astro  cookies.astro   ← RU
│     ├─ uk/…  en/…  es/…
│     └─ api/lead.ts            ← или functions/api/lead.ts под выбранный хостинг
└─ public/ favicon.svg  og/*.png  robots.txt
```

---

## 12. Критерии приёмки

- [ ] Все 5 блоков в заданном порядке на четырёх языках (RU основной, UK, EN, ES), тексты из JSON.
- [ ] Есть `docs/reference-styles.md` со стилями референса, токены обновлены по нему.
- [ ] Кириллица, включая украинские і, ї, є, ґ, отображается правильно, без fallback-шрифтов.
- [ ] Форма бизнеса и форма соискателя валидируются, отправляются, приходят в Telegram (в разные треды) и в Google Sheets (на разные листы) с UTM.
- [ ] Клик по карточке направления предзаполняет селект.
- [ ] «Я ищу работу» из hero раскрывает форму соискателя.
- [ ] Success и error состояния работают, при ошибке данные не теряются.
- [ ] Honeypot, Turnstile и rate limit работают (проверить ботом/curl).
- [ ] WhatsApp FAB и sticky CTA на mobile не перекрывают друг друга и форму.
- [ ] Lighthouse mobile: Perf ≥ 95, A11y ≥ 95, SEO 100, Best Practices ≥ 95.
- [ ] Нет горизонтального скролла на 360 px.
- [ ] hreflang, canonical, sitemap и schema валидны (Rich Results Test).
- [ ] Юр. страницы есть, чекбокс согласия не отмечен по умолчанию.
- [ ] События аналитики приходят.

---

## 13. Что нужно от заказчика до запуска

1. Домен для Smena.
2. Номер WhatsApp Business, email, ссылки на соцсети.
3. Юр. данные для Aviso legal (имя/компания, NIF, адрес).
4. Telegram-бот (токен) и группа с топиками; Google-таблица.
5. Фото: собственные или подтверждение использовать сток на старте.
6. Подтверждение условий оферты: что именно значит «оплата за результат», и с какого момента считается 30-дневная гарантия. Это нужно, чтобы тексты на сайте совпадали с договором.

---

## 14. Промпты для Claude Code (по этапам)

0. *«Прочитай SPEC.md. Открой в моём браузере референс из раздела 4, пройди его на 1440 и 390 px, сними скриншоты и через getComputedStyle выпиши шрифты, размеры, цвета, радиусы, отступы, кнопки и анимации. Сохрани в docs/reference-styles.md и предложи правки токенов раздела 4.»*
1. *«Инициализируй проект Astro 5 + TS + Tailwind v4 + @astrojs/vue + sitemap по разделам 3 и 11. Настрой i18n ru (default)/uk/en/es по разделу 2, токены по docs/reference-styles.md, шрифты с кириллицей через fontsource. Пока без секций.»*
2. *«Сверстай Header, Hero, Marquee по разделу 5, mobile-first. Тексты вынеси в i18n JSON на четырёх языках, RU основной.»*
3. *«Сверстай блоки 2 и 3 (Roles, Process) по SPEC.md, включая reveal-анимации и prefers-reduced-motion.»*
4. *«Сделай LeadForm.vue и CandidateForm.vue по разделу 4: zod-схема в lib, libphonenumber, состояния, предзаполнение роли через URL-hash/событие, UTM из sessionStorage.»*
5. *«Сделай /api/lead под [Cloudflare Pages / Netlify]: Turnstile, honeypot, rate limit, Telegram + Sheets webhook. Добавь .env.example. Отдельно дай Apps Script для таблицы.»*
6. *«Footer, WhatsApp FAB, StickyCta, юр. страницы-шаблоны, SEO-мета, schema, OG.»*
7. *«Прогони Lighthouse и axe, исправь всё ниже порогов из раздела 12, проверь 360/390/768/1280.»*
