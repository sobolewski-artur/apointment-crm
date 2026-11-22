<script setup lang="ts">
import type { Treatment } from '~/data/treatments'

const props = defineProps<{ treatment: Treatment }>()

const { t } = useI18n()
const fmt = useFormat()
const { has, toggle } = useCart()

const selected = computed(() => has(props.treatment.id))
</script>

<template>
  <article
    class="flex flex-col rounded-2xl bg-white p-6 transition hover:shadow-lg hover:shadow-stone-200/70"
    :class="selected ? 'ring-2 ring-rose-400' : 'ring-1 ring-stone-200'"
  >
    <span class="text-xs font-semibold uppercase tracking-wider text-rose-500">
      {{ t(`categories.${treatment.category}`) }}
    </span>
    <h3 class="mt-2 font-serif text-xl font-medium text-stone-900">
      {{ t(`treatments.items.${treatment.id}.name`) }}
    </h3>
    <p class="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
      {{ t(`treatments.items.${treatment.id}.description`) }}
    </p>

    <div class="mt-6 flex items-end justify-between gap-3">
      <div>
        <div class="text-lg font-semibold text-stone-900">{{ fmt.price(treatment.price) }}</div>
        <div class="text-xs text-stone-500">{{ fmt.duration(treatment.durationMin) }}</div>
      </div>
      <button
        type="button"
        class="rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        :class="selected
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
          : 'bg-stone-900 text-white hover:bg-stone-700'"
        :aria-pressed="selected"
        @click="toggle(treatment.id)"
      >
        {{ selected ? `✓ ${t('treatments.added')}` : `+ ${t('treatments.add')}` }}
      </button>
    </div>
  </article>
</template>
