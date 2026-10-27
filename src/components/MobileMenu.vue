<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface NavLink {
  href: string;
  label: string;
}

interface LangLink {
  href: string;
  label: string;
  name: string;
  hreflang: string;
  current: boolean;
}

const props = defineProps<{
  links: NavLink[];
  langs: LangLink[];
  cta: { href: string; label: string };
  openLabel: string;
  closeLabel: string;
  navLabel: string;
  langLabel: string;
}>();

const open = ref(false);
const mounted = ref(false);

onMounted(() => {
  mounted.value = true;
});
const toggleRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

function close(returnFocus = true) {
  open.value = false;
  if (returnFocus) nextTick(() => toggleRef.value?.focus());
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close();
    return;
  }
  if (event.key !== 'Tab' || !panelRef.value) return;
  const focusable = panelRef.value.querySelectorAll<HTMLElement>('a[href], button');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

watch(open, async (value) => {
  document.documentElement.style.overflow = value ? 'hidden' : '';
  if (value) {
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    panelRef.value?.querySelector<HTMLElement>('button')?.focus();
  } else {
    document.removeEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.documentElement.style.overflow = '';
});

function langHref(href: string) {
  return location.hash ? href + location.hash : href;
}
</script>

<template>
  <button
    ref="toggleRef"
    type="button"
    class="menu-toggle"
    :aria-label="props.openLabel"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click="open = true"
  >
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16" /><path d="M4 16h16" /></svg>
  </button>

  <Teleport v-if="mounted" to="body">
    <Transition name="menu">
      <div v-if="open" ref="panelRef" class="menu-panel" role="dialog" aria-modal="true" :aria-label="props.navLabel">
        <div class="menu-top">
          <span class="menu-logo">Smena</span>
          <button type="button" class="menu-toggle" :aria-label="props.closeLabel" @click="close()">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <nav :aria-label="props.navLabel">
          <ul class="menu-links">
            <li v-for="(link, index) in props.links" :key="link.href" :style="{ '--i': index }">
              <a :href="link.href" @click="close(false)">{{ link.label }}</a>
            </li>
          </ul>
        </nav>

        <div class="menu-bottom">
          <a class="btn btn-block" :href="props.cta.href" data-intent="business" data-event="cta_menu_business" @click="close(false)">
            {{ props.cta.label }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </a>
          <nav :aria-label="props.langLabel">
            <ul class="menu-langs">
              <li v-for="item in props.langs" :key="item.href">
                <a
                  :href="item.href"
                  :hreflang="item.hreflang"
                  :lang="item.hreflang"
                  :aria-current="item.current ? 'true' : undefined"
                  @click="($event.currentTarget as HTMLAnchorElement).href = langHref(item.href)"
                >{{ item.label }}<span class="sr-only"> — {{ item.name }}</span></a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.menu-toggle {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-right: -8px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.menu-panel {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  padding: 10px var(--gutter) calc(24px + env(safe-area-inset-bottom));
  background: var(--butter);
  color: var(--ink);
  overflow-y: auto;
}

.menu-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: calc(var(--header-h) - 10px);
}

.menu-logo {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 30px;
  letter-spacing: -0.03em;
}

.menu-links {
  margin: 40px 0 0;
  padding: 0;
  list-style: none;
}

.menu-links li {
  border-bottom: 1px solid var(--line-strong);
  animation: menu-item .45s var(--ease-out) both;
  animation-delay: calc(var(--i) * 60ms + 80ms);
}

.menu-links a {
  display: block;
  padding: 18px 0;
  font-family: var(--font-display);
  font-size: 38px;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  text-decoration: none;
  color: inherit;
}

.menu-bottom {
  display: grid;
  gap: 20px;
  margin-top: auto;
  padding-top: 40px;
}

.menu-langs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-langs a {
  display: grid;
  place-items: center;
  min-width: 52px;
  min-height: 44px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--ink);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: .06em;
  text-decoration: none;
  color: inherit;
}

.menu-langs a[aria-current] {
  background: var(--ink);
  color: var(--butter);
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity .3s var(--ease-out), transform .3s var(--ease-out);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

@keyframes menu-item {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}
</style>
