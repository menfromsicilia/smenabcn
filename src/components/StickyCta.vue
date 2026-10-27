<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ label: string }>();

const visible = ref(false);
let heroVisible = true;
let formVisible = false;
let observer: IntersectionObserver | undefined;

function update() {
  visible.value = !heroVisible && !formVisible;
  const root = document.documentElement;
  root.dataset.sticky = visible.value ? '1' : '0';
  root.dataset.formVisible = formVisible ? '1' : '0';
}

onMounted(() => {
  const hero = document.querySelector('[data-hero]');
  const form = document.querySelector('[data-form-section]');
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === hero) heroVisible = entry.isIntersecting;
      if (entry.target === form) formVisible = entry.isIntersecting;
    }
    update();
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  if (hero) observer.observe(hero);
  if (form) observer.observe(form);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  document.documentElement.dataset.sticky = '0';
});
</script>

<template>
  <div class="sticky-cta" :class="{ 'is-visible': visible }" :aria-hidden="!visible">
    <a class="btn btn-block" href="#form" data-intent="business" data-event="cta_sticky_business" :tabindex="visible ? undefined : -1">
      {{ props.label }}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    </a>
  </div>
</template>

<style scoped>
.sticky-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  padding-right: 16px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 -1px 0 var(--line);
  transform: translateY(110%);
  transition: transform .35s var(--ease-out);
}

.sticky-cta.is-visible {
  transform: none;
}

@media (min-width: 768px) {
  .sticky-cta {
    display: none;
  }
}
</style>
