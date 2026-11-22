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
  <div class="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
    <h1 class="font-serif text-3xl font-medium text-stone-900 sm:text-4xl">{{ t('treatments.title') }}</h1>
    <p class="mt-3 text-stone-600">{{ t('treatments.subtitle') }}</p>

    <!-- Single swipeable row on phones, wraps from sm up -->
    <div class="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-8 sm:flex-wrap sm:overflow-visible sm:px-0">
      <button
        v-for="f in filters"
        :key="f"
        type="button"
        class="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition"
        :class="active === f ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-300'"
        :aria-pressed="active === f"
        @click="active = f"
      >
        {{ t(`categories.${f}`) }}
      </button>
    </div>

    <div class="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      <TreatmentCard v-for="tr in visible" :key="tr.id" :treatment="tr" />
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-6 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-6 opacity-0"
    >
      <div v-if="count" class="fixed inset-x-0 bottom-3 z-20 px-3 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:px-4">
        <div class="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-white shadow-2xl sm:gap-4 sm:px-5">
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium">{{ t('treatments.selectedBar', count) }}</div>
            <div class="truncate text-xs text-stone-400">{{ fmt.duration(totalDuration) }} · {{ fmt.price(totalPrice) }}</div>
          </div>
          <NuxtLinkLocale
            to="/booking"
            class="shrink-0 whitespace-nowrap rounded-xl bg-rose-400 px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-rose-300"
          >
            <span class="sm:hidden">{{ t('nav.booking') }} →</span>
            <span class="hidden sm:inline">{{ t('treatments.continue') }} →</span>
          </NuxtLinkLocale>
        </div>
      </div>
    </Transition>
  </div>
</template>
