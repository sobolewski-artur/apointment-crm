<script setup lang="ts">
import { treatments } from '~/data/treatments'

const { t } = useI18n()

useHead({ title: '' })
useSeoMeta({ description: () => t('home.subtitle') })

const featured = treatments.filter(tr => tr.featured)
const reasons = ['experts', 'safety', 'natural'] as const
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div aria-hidden="true" class="pointer-events-none absolute -right-40 -top-40 size-[34rem] rounded-full bg-rose-200/50 blur-3xl" />
      <div aria-hidden="true" class="pointer-events-none absolute -bottom-48 -left-32 size-[28rem] rounded-full bg-amber-100/70 blur-3xl" />

      <div class="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">{{ t('home.eyebrow') }}</p>
        <h1 class="mt-4 max-w-3xl font-serif text-4xl font-medium leading-tight text-stone-900 sm:text-6xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">{{ t('home.subtitle') }}</p>
        <div class="mt-10 flex flex-wrap gap-3">
          <NuxtLinkLocale
            to="/treatments"
            class="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700"
          >
            {{ t('home.ctaTreatments') }}
          </NuxtLinkLocale>
          <NuxtLinkLocale
            to="/booking"
            class="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:ring-stone-400"
          >
            {{ t('home.ctaBook') }}
          </NuxtLinkLocale>
        </div>
      </div>
    </section>

    <!-- Featured -->
    <section class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="font-serif text-3xl font-medium text-stone-900">{{ t('home.featuredTitle') }}</h2>
          <p class="mt-2 text-stone-600">{{ t('home.featuredSubtitle') }}</p>
        </div>
        <NuxtLinkLocale to="/treatments" class="text-sm font-semibold text-rose-600 hover:text-rose-700">
          {{ t('home.seeAll') }} →
        </NuxtLinkLocale>
      </div>
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <TreatmentCard v-for="tr in featured" :key="tr.id" :treatment="tr" />
      </div>
    </section>

    <!-- Why us -->
    <section class="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <h2 class="font-serif text-3xl font-medium text-stone-900">{{ t('home.whyTitle') }}</h2>
      <div class="mt-8 grid gap-8 md:grid-cols-3">
        <div v-for="(key, i) in reasons" :key="key" class="border-t border-stone-300 pt-6">
          <div class="font-serif text-2xl text-rose-400">0{{ i + 1 }}</div>
          <h3 class="mt-3 font-semibold text-stone-900">{{ t(`home.why.${key}.title`) }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ t(`home.why.${key}.text`) }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
      <div class="rounded-3xl bg-stone-900 px-8 py-14 text-center text-white sm:px-16">
        <h2 class="font-serif text-3xl font-medium">{{ t('home.ctaTitle') }}</h2>
        <p class="mx-auto mt-3 max-w-xl text-stone-300">{{ t('home.ctaText') }}</p>
        <NuxtLinkLocale
          to="/booking"
          class="mt-8 inline-block rounded-xl bg-rose-400 px-6 py-3 text-sm font-semibold text-stone-900 transition hover:bg-rose-300"
        >
          {{ t('home.ctaBook') }}
        </NuxtLinkLocale>
      </div>
    </section>
  </div>
</template>
