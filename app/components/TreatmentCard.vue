<script setup lang="ts">
import type { Treatment } from '~/data/treatments'

const props = defineProps<{ treatment: Treatment }>()

const { t } = useI18n()
const fmt = useFormat()
const { has, toggle } = useCart()

const selected = computed(() => has(props.treatment.id))
const name = computed(() => t(`treatments.items.${props.treatment.id}.name`))
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-2xl bg-white transition hover:shadow-lg hover:shadow-stone-200/70"
    :class="selected ? 'ring-2 ring-rose-400' : 'ring-1 ring-stone-200'"
  >
    <div class="relative overflow-hidden">
      <UnsplashImage
        :photo="treatment.image"
        :alt="name"
        :aspect="3 / 2"
        :widths="[360, 480, 640, 800]"
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        class="aspect-[3/2] w-full transition duration-500 group-hover:scale-105"
      />
      <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 backdrop-blur">
        {{ t(`categories.${treatment.category}`) }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5 sm:p-6">
      <h3 class="font-serif text-xl font-medium text-stone-900">{{ name }}</h3>
      <p class="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
        {{ t(`treatments.items.${treatment.id}.description`) }}
      </p>

      <div class="mt-5 flex items-end justify-between gap-3 sm:mt-6">
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
    </div>
  </article>
</template>
