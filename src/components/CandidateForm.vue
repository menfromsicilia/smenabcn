<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import '../styles/form.css';
import { candidateFields, PROFESSION_OPTIONS, type ErrorCode } from '../lib/lead-schema';
import { onIntent } from '../lib/intent';
import { track } from '../lib/analytics';
import { getTurnstileToken, preloadTurnstile } from '../lib/turnstile';
import { submitLead } from '../lib/submit-lead';
import type { Dict } from '../i18n/utils';

type FormDict = Dict['form'];
type Field = 'name' | 'whatsapp' | 'profession' | 'consent';

const props = defineProps<{
  lang: string;
  t: FormDict;
  privacyHref: string;
  whatsappHref: string;
}>();

const FIELDS: Field[] = ['name', 'whatsapp', 'profession', 'consent'];

const open = ref(false);
const values = reactive({ name: '', whatsapp: '', profession: '', consent: false });
const honeypot = ref('');
const touched = reactive<Record<Field, boolean>>({ name: false, whatsapp: false, profession: false, consent: false });
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const errorKind = ref<'server' | 'rate'>('server');
const panel = ref<HTMLElement | null>(null);
const turnstileEl = ref<HTMLElement | null>(null);
const c = computed(() => props.t.candidate);
const professionOptions = computed(() => PROFESSION_OPTIONS.map((key) => ({ key, label: props.t.roleOptions[key] })));

function validateField(field: Field): ErrorCode | null {
  const schema = candidateFields.shape[field] as { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } };
  const result = schema.safeParse(values[field]);
  return result.success ? null : (result.error?.issues[0]?.message as ErrorCode);
}

const errors = computed(() => {
  const out: Partial<Record<Field, string>> = {};
  for (const field of FIELDS) {
    if (!touched[field]) continue;
    const code = validateField(field);
    if (code) out[field] = props.t.errors[code];
  }
  return out;
});

function blur(field: Field) {
  touched[field] = true;
}

async function reveal(focus: boolean) {
  open.value = true;
  preloadTurnstile()?.catch(() => {});
  if (!focus) return;
  await nextTick();
  setTimeout(() => panel.value?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true }), 450);
}

async function onSubmit() {
  if (status.value === 'loading') return;
  FIELDS.forEach((field) => (touched[field] = true));
  const parsed = candidateFields.safeParse(values);
  if (!parsed.success) {
    const first = FIELDS.find((field) => validateField(field));
    await nextTick();
    panel.value?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return;
  }

  status.value = 'loading';
  let token = '';
  try {
    if (turnstileEl.value) token = await getTurnstileToken(turnstileEl.value, props.lang);
  } catch {
    token = '';
  }

  const result = await submitLead({
    type: 'candidate',
    ...values,
    whatsapp: parsed.data.whatsapp,
    lang: props.lang,
    company_site: honeypot.value,
    turnstile_token: token,
  });

  if (result.ok) {
    status.value = 'success';
    track('lead_candidate', { profession: values.profession, lang: props.lang });
    return;
  }
  errorKind.value = result.status === 429 ? 'rate' : 'server';
  status.value = 'error';
  track('form_error', { form: 'candidate', status: result.status });
}

let stopIntent: (() => void) | undefined;

onMounted(() => {
  stopIntent = onIntent('candidate', () => reveal(true));
  if (location.hash === '#candidate') reveal(true);
});

onBeforeUnmount(() => stopIntent?.());
</script>

<template>
  <div id="candidate" class="cand">
    <div class="cand-row">
      <p class="cand-text"><strong>{{ c.lead }}</strong> {{ c.text }}</p>
      <button
        v-if="!open"
        type="button"
        class="btn btn-secondary cand-toggle"
        aria-controls="candidate-panel"
        :aria-expanded="open"
        @click="reveal(true)"
      >
        {{ c.toggle }}
      </button>
    </div>

    <div v-show="open" id="candidate-panel" ref="panel" class="cand-panel">
      <p v-if="status === 'success'" class="cand-success" role="status">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        {{ c.success }}
      </p>

      <form v-else novalidate :aria-label="c.formLabel" @submit.prevent="onSubmit">
        <div class="cand-grid">
          <div class="f-field">
            <label class="f-label" for="cand-name">{{ c.name.label }}</label>
            <input
              id="cand-name"
              v-model="values.name"
              class="f-control"
              name="name"
              type="text"
              autocomplete="name"
              maxlength="60"
              :placeholder="c.name.placeholder"
              :aria-invalid="!!errors.name"
              :aria-describedby="errors.name ? 'cand-name-error' : undefined"
              required
              @blur="blur('name')"
            />
            <p v-if="errors.name" id="cand-name-error" class="f-error">{{ errors.name }}</p>
          </div>

          <div class="f-field">
            <label class="f-label" for="cand-whatsapp">{{ c.whatsapp.label }}</label>
            <input
              id="cand-whatsapp"
              v-model="values.whatsapp"
              class="f-control"
              name="whatsapp"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              maxlength="24"
              :placeholder="c.whatsapp.placeholder"
              :aria-invalid="!!errors.whatsapp"
              :aria-describedby="errors.whatsapp ? 'cand-whatsapp-error' : undefined"
              required
              @blur="blur('whatsapp')"
            />
            <p v-if="errors.whatsapp" id="cand-whatsapp-error" class="f-error">{{ errors.whatsapp }}</p>
          </div>

          <div class="f-field">
            <label class="f-label" for="cand-profession">{{ c.profession.label }}</label>
            <select
              id="cand-profession"
              v-model="values.profession"
              class="f-control f-select"
              :class="{ 'is-empty': !values.profession }"
              name="profession"
              :aria-invalid="!!errors.profession"
              :aria-describedby="errors.profession ? 'cand-profession-error' : undefined"
              required
              @blur="blur('profession')"
              @change="blur('profession')"
            >
              <option value="" disabled>{{ c.profession.placeholder }}</option>
              <option v-for="option in professionOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
            </select>
            <p v-if="errors.profession" id="cand-profession-error" class="f-error">{{ errors.profession }}</p>
          </div>

          <div class="cand-submit">
            <button class="btn btn-block" type="submit" :disabled="status === 'loading'" :aria-busy="status === 'loading'">
              <span v-if="status === 'loading'" class="f-spinner" aria-hidden="true"></span>
              {{ status === 'loading' ? props.t.sending : c.submit }}
            </button>
          </div>
        </div>

        <div class="f-hp" aria-hidden="true">
          <label for="cand-company-site">Company site</label>
          <input id="cand-company-site" v-model="honeypot" name="company_site" type="text" tabindex="-1" autocomplete="off" />
        </div>

        <div class="f-field cand-consent">
          <label class="f-check">
            <input
              v-model="values.consent"
              name="consent"
              type="checkbox"
              :aria-invalid="!!errors.consent"
              :aria-describedby="errors.consent ? 'cand-consent-error' : undefined"
              required
              @change="blur('consent')"
              @blur="blur('consent')"
            />
            <span>{{ props.t.consent.before }}<a :href="props.privacyHref" target="_blank" rel="noopener">{{ props.t.consent.link }}</a>{{ props.t.consent.after }}</span>
          </label>
          <p v-if="errors.consent" id="cand-consent-error" class="f-error">{{ errors.consent }}</p>
        </div>

        <div v-if="status === 'error'" class="f-alert cand-alert">
          <span>{{ errorKind === 'rate' ? props.t.errors.rate : props.t.failure.text }}</span>
          <a class="btn f-wa" :href="props.whatsappHref" target="_blank" rel="noopener" data-wa-placement="candidate_error">{{ props.t.failure.cta }}</a>
        </div>

        <div ref="turnstileEl" class="f-turnstile"></div>
        <p class="f-small">{{ c.privacyInfo }}</p>
      </form>
    </div>

    <p class="sr-only" aria-live="polite">{{ status === 'loading' ? props.t.sending : status === 'success' ? c.success : status === 'error' ? props.t.failure.text : '' }}</p>
  </div>
</template>

<style scoped>
.cand {
  margin-top: 20px;
  padding: 22px 24px;
  border-radius: var(--radius-lg);
  border: 1.5px dashed var(--line-strong);
}

.cand-row {
  display: grid;
  gap: 14px;
  align-items: center;
}

.cand-text {
  font-size: 15px;
}

.cand-toggle {
  justify-self: start;
  min-height: 48px;
}

.cand-panel {
  margin-top: 20px;
}

.cand-grid {
  display: grid;
  gap: 16px;
}

.cand-consent {
  margin-top: 16px;
}

.cand-alert,
.f-small {
  margin-top: 16px;
}

.cand-success {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0;
  font-weight: 600;
}

@media (min-width: 768px) {
  .cand-row {
    grid-template-columns: 1fr auto;
  }
}

@media (min-width: 1024px) {
  .cand-grid {
    grid-template-columns: 1fr 1fr 1fr auto;
    align-items: start;
  }

  .cand-submit {
    padding-top: 30px;
  }
}
</style>
