<script setup lang="ts">
import { treatmentCategories, treatments, type TreatmentCategory } from '~/data/treatments'

const { t } = useI18n()
const fmt = useFormat()
const { count, totalPrice, totalDuration } = useCart()

useHead({ title: () => t('treatments.title') })

const active = ref<TreatmentCategory | 'all'>('all')
const filters = ['all', ...treatmentCategories] as const

const visible = computed(() =>
  active.value === 'all' ? treatments : treatments.filter(tr => tr.category === active.value),
)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pb-28 pt-12 sm:px-6">
    <h1 class="font-serif text-4xl font-medium text-stone-900">{{ t('treatments.title') }}</h1>
    <p class="mt-3 text-stone-600">{{ t('treatments.subtitle') }}</p>

    <div class="mt-8 flex flex-wrap gap-2">
      <button
        v-for="f in filters"
        :key="f"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-medium transition"
        :class="active === f ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-300'"
        :aria-pressed="active === f"
        @click="active = f"
      >
        {{ t(`categories.${f}`) }}
      </button>
    </div>

    <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <TreatmentCard v-for="tr in visible" :key="tr.id" :treatment="tr" />
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-6 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-6 opacity-0"
    >
      <div v-if="count" class="fixed inset-x-0 bottom-4 z-20 px-4">
        <div class="mx-auto flex max-w-3xl items-center gap-4 rounded-2xl bg-stone-900 px-5 py-3 text-white shadow-2xl">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium">{{ t('treatments.selectedBar', count) }}</div>
            <div class="text-xs text-stone-400">{{ fmt.duration(totalDuration) }} · {{ fmt.price(totalPrice) }}</div>
          </div>
          <NuxtLinkLocale
            to="/booking"
            class="shrink-0 rounded-xl bg-rose-400 px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-rose-300"
          >
            {{ t('treatments.continue') }} →
          </NuxtLinkLocale>
        </div>
      </div>
    </Transition>
  </div>
</template>
