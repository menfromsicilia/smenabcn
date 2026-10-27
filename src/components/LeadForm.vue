<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import '../styles/form.css';
import { businessFields, ROLE_OPTIONS, type ErrorCode } from '../lib/lead-schema';
import { onIntent } from '../lib/intent';
import { track } from '../lib/analytics';
import { getTurnstileToken, preloadTurnstile } from '../lib/turnstile';
import { submitLead } from '../lib/submit-lead';
import type { Dict } from '../i18n/utils';

type FormDict = Dict['form'];
type Field = 'name' | 'business' | 'role' | 'whatsapp' | 'consent';

const props = defineProps<{
  lang: string;
  t: FormDict;
  privacyHref: string;
  whatsappHref: string;
}>();

const FIELDS: Field[] = ['name', 'business', 'role', 'whatsapp', 'consent'];

const values = reactive({ name: '', business: '', role: '', whatsapp: '', consent: false });
const honeypot = ref('');
const touched = reactive<Record<Field, boolean>>({ name: false, business: false, role: false, whatsapp: false, consent: false });
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const errorKind = ref<'server' | 'rate'>('server');
const flashRole = ref(false);
const started = ref(false);
const root = ref<HTMLElement | null>(null);
const turnstileEl = ref<HTMLElement | null>(null);
const successHeading = ref<HTMLElement | null>(null);

const roleOptions = computed(() => ROLE_OPTIONS.map((key) => ({ key, label: props.t.roleOptions[key] })));

function validateField(field: Field): ErrorCode | null {
  const schema = businessFields.shape[field] as { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } };
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

function onFocusIn() {
  if (started.value) return;
  started.value = true;
  track('form_start');
  preloadTurnstile()?.catch(() => {});
}

const waHref = computed(() => {
  const url = new URL(props.whatsappHref);
  const base = url.searchParams.get('text') || '';
  const extra = values.business.trim() ? ` (${values.business.trim()})` : '';
  url.searchParams.set('text', base + extra);
  return url.toString();
});

async function onSubmit() {
  if (status.value === 'loading') return;
  FIELDS.forEach((field) => (touched[field] = true));
  const parsed = businessFields.safeParse(values);
  if (!parsed.success) {
    const first = FIELDS.find((field) => validateField(field));
    await nextTick();
    root.value?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
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
    type: 'business',
    ...values,
    whatsapp: parsed.data.whatsapp,
    lang: props.lang,
    company_site: honeypot.value,
    turnstile_token: token,
  });

  if (result.ok) {
    status.value = 'success';
    track('lead_business', { role: values.role, lang: props.lang });
    await nextTick();
    successHeading.value?.focus();
    return;
  }
  errorKind.value = result.status === 429 ? 'rate' : 'server';
  status.value = 'error';
  track('form_error', { form: 'business', status: result.status });
}

let stopIntent: (() => void) | undefined;

onMounted(() => {
  const preset = new URLSearchParams(location.search).get('role');
  if (preset && (ROLE_OPTIONS as readonly string[]).includes(preset)) values.role = preset;

  stopIntent = onIntent('business', (intent) => {
    if (!intent.role) return;
    values.role = intent.role;
    touched.role = false;
    flashRole.value = false;
    requestAnimationFrame(() => (flashRole.value = true));
  });
});

onBeforeUnmount(() => stopIntent?.());
</script>

<template>
  <div ref="root" class="lead-card">
    <div v-if="status === 'success'" class="lead-success">
      <span class="lead-success-icon" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </span>
      <h3 ref="successHeading" class="h2" tabindex="-1">{{ props.t.success.title }}</h3>
      <p class="lead-success-text">{{ props.t.success.text }}</p>
      <a class="btn btn-block f-wa" :href="waHref" target="_blank" rel="noopener" data-wa-placement="form_success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
        {{ props.t.success.cta }}
      </a>
    </div>

    <form v-else class="f-grid" novalidate :aria-label="props.t.formLabel" @submit.prevent="onSubmit" @focusin="onFocusIn">
      <div class="f-field">
        <label class="f-label" for="lead-name">{{ props.t.fields.name.label }}</label>
        <input
          id="lead-name"
          v-model="values.name"
          class="f-control"
          name="name"
          type="text"
          autocomplete="name"
          maxlength="60"
          :placeholder="props.t.fields.name.placeholder"
          :aria-invalid="!!errors.name"
          :aria-describedby="errors.name ? 'lead-name-error' : undefined"
          required
          @blur="blur('name')"
        />
        <p v-if="errors.name" id="lead-name-error" class="f-error">{{ errors.name }}</p>
      </div>

      <div class="f-field">
        <label class="f-label" for="lead-business">{{ props.t.fields.business.label }}</label>
        <input
          id="lead-business"
          v-model="values.business"
          class="f-control"
          name="business"
          type="text"
          autocomplete="organization"
          maxlength="80"
          :placeholder="props.t.fields.business.placeholder"
          :aria-invalid="!!errors.business"
          :aria-describedby="errors.business ? 'lead-business-error' : undefined"
          required
          @blur="blur('business')"
        />
        <p v-if="errors.business" id="lead-business-error" class="f-error">{{ errors.business }}</p>
      </div>

      <div class="f-field">
        <label class="f-label" for="lead-role">{{ props.t.fields.role.label }}</label>
        <select
          id="lead-role"
          v-model="values.role"
          class="f-control f-select"
          :class="{ 'is-empty': !values.role, 'is-flash': flashRole }"
          name="role"
          :aria-invalid="!!errors.role"
          :aria-describedby="errors.role ? 'lead-role-error' : undefined"
          required
          @blur="blur('role')"
          @change="blur('role')"
          @animationend="flashRole = false"
        >
          <option value="" disabled>{{ props.t.fields.role.placeholder }}</option>
          <option v-for="option in roleOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
        </select>
        <p v-if="errors.role" id="lead-role-error" class="f-error">{{ errors.role }}</p>
      </div>

      <div class="f-field">
        <label class="f-label" for="lead-whatsapp">{{ props.t.fields.whatsapp.label }}</label>
        <input
          id="lead-whatsapp"
          v-model="values.whatsapp"
          class="f-control"
          name="whatsapp"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          maxlength="24"
          :placeholder="props.t.fields.whatsapp.placeholder"
          :aria-invalid="!!errors.whatsapp"
          :aria-describedby="errors.whatsapp ? 'lead-whatsapp-error' : undefined"
          required
          @blur="blur('whatsapp')"
        />
        <p v-if="errors.whatsapp" id="lead-whatsapp-error" class="f-error">{{ errors.whatsapp }}</p>
      </div>

      <div class="f-hp" aria-hidden="true">
        <label for="lead-company-site">Company site</label>
        <input id="lead-company-site" v-model="honeypot" name="company_site" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <div class="f-field">
        <label class="f-check">
          <input
            v-model="values.consent"
            name="consent"
            type="checkbox"
            :aria-invalid="!!errors.consent"
            :aria-describedby="errors.consent ? 'lead-consent-error' : undefined"
            required
            @change="blur('consent')"
            @blur="blur('consent')"
          />
          <span>{{ props.t.consent.before }}<a :href="props.privacyHref" target="_blank" rel="noopener">{{ props.t.consent.link }}</a>{{ props.t.consent.after }}</span>
        </label>
        <p v-if="errors.consent" id="lead-consent-error" class="f-error">{{ errors.consent }}</p>
      </div>

      <div v-if="status === 'error'" class="f-alert">
        <span>{{ errorKind === 'rate' ? props.t.errors.rate : props.t.failure.text }}</span>
        <a class="btn btn-block f-wa" :href="waHref" target="_blank" rel="noopener" data-wa-placement="form_error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
          {{ props.t.failure.cta }}
        </a>
      </div>

      <div ref="turnstileEl" class="f-turnstile"></div>

      <button class="btn btn-block" type="submit" :disabled="status === 'loading'" :aria-busy="status === 'loading'">
        <span v-if="status === 'loading'" class="f-spinner" aria-hidden="true"></span>
        {{ status === 'loading' ? props.t.sending : status === 'error' ? props.t.failure.retry : props.t.submit }}
        <svg v-if="status !== 'loading'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </button>

      <p class="f-small">{{ props.t.privacyInfo }}</p>
    </form>

    <p class="sr-only" aria-live="polite">{{ status === 'loading' ? props.t.sending : status === 'success' ? props.t.success.title + ' ' + props.t.success.text : status === 'error' ? props.t.failure.text : '' }}</p>
  </div>
</template>

<style scoped>
.lead-card {
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: 0 1px 0 var(--line), 0 30px 60px -40px rgb(28 26 23 / .4);
}

.lead-success {
  display: grid;
  gap: 18px;
  justify-items: start;
  padding: 12px 0;
}

.lead-success .h2 {
  outline: none;
}

.lead-success-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--butter);
}

.lead-success-text {
  font-size: 18px;
}

@media (min-width: 1024px) {
  .lead-card {
    padding: 40px;
  }
}
</style>
