<script setup lang="ts">
import { openingHours } from '~/data/salon'

const { t } = useI18n()

const range = (day: number) => {
  const h = openingHours[day]
  return h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : t('footer.closed')
}

const rows = computed(() => [
  { label: t('footer.weekdays'), value: range(1) },
  { label: t('footer.saturday'), value: range(6) },
  { label: t('footer.sunday'), value: range(0) },
])

const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-stone-200 bg-white">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
      <div>
        <div class="font-serif text-xl font-semibold text-stone-900">
          Aura <span class="text-rose-500">Beauty</span>
        </div>
        <p class="mt-2 text-sm text-stone-500">{{ t('footer.tagline') }}</p>
      </div>
      <div>
        <h2 class="text-sm font-semibold text-stone-900">{{ t('footer.hours') }}</h2>
        <dl class="mt-3 space-y-1.5 text-sm">
          <div v-for="row in rows" :key="row.label" class="flex max-w-xs justify-between gap-4">
            <dt class="text-stone-500">{{ row.label }}</dt>
            <dd class="font-medium text-stone-700">{{ row.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
    <div class="border-t border-stone-100 py-5 text-center text-xs text-stone-400">
      © {{ year }} {{ t('brand') }}. {{ t('footer.rights') }}
    </div>
  </footer>
</template>
