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

      <div class="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-24">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500 sm:text-sm">{{ t('home.eyebrow') }}</p>
          <h1 class="mt-4 text-balance font-serif text-4xl font-medium leading-tight text-stone-900 sm:text-5xl lg:text-6xl">
            {{ t('home.title') }}
          </h1>
          <p class="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:mt-6 sm:text-lg">{{ t('home.subtitle') }}</p>
          <div class="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
            <NuxtLinkLocale
              to="/treatments"
              class="rounded-xl bg-stone-900 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700"
            >
              {{ t('home.ctaTreatments') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale
              to="/booking"
              class="rounded-xl bg-white px-6 py-3 text-center text-sm font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:ring-stone-400"
            >
              {{ t('home.ctaBook') }}
            </NuxtLinkLocale>
          </div>
        </div>

        <div class="relative">
          <UnsplashImage
            photo="facialMask"
            :alt="t('images.hero')"
            :aspect="4 / 5"
            sizes="(min-width: 1152px) 540px, (min-width: 1024px) 45vw, 100vw"
            priority
            class="aspect-[4/3] w-full rounded-3xl shadow-xl shadow-stone-300/40 sm:aspect-[16/10] lg:aspect-[4/5]"
          />
          <div class="absolute -bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:left-6">
            <div class="text-xs font-medium text-stone-500">{{ t('home.badgeLabel') }}</div>
            <div class="font-serif text-lg text-stone-900">{{ t('home.badgeValue') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured -->
    <section class="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="font-serif text-2xl font-medium text-stone-900 sm:text-3xl">{{ t('home.featuredTitle') }}</h2>
          <p class="mt-2 text-stone-600">{{ t('home.featuredSubtitle') }}</p>
        </div>
        <NuxtLinkLocale to="/treatments" class="text-sm font-semibold text-rose-600 hover:text-rose-700">
          {{ t('home.seeAll') }} →
        </NuxtLinkLocale>
      </div>
      <div class="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <TreatmentCard v-for="tr in featured" :key="tr.id" :treatment="tr" />
      </div>
    </section>

    <!-- Why us -->
    <section class="mx-auto mt-16 grid max-w-6xl items-center gap-8 px-4 sm:mt-24 sm:px-6 md:grid-cols-2 md:gap-14">
      <UnsplashImage
        photo="salonInterior"
        :alt="t('images.salon')"
        :aspect="4 / 5"
        sizes="(min-width: 1152px) 540px, (min-width: 768px) 50vw, 100vw"
        class="aspect-[4/3] w-full rounded-3xl md:aspect-[4/5]"
      />
      <div>
        <h2 class="font-serif text-2xl font-medium text-stone-900 sm:text-3xl">{{ t('home.whyTitle') }}</h2>
        <div class="mt-6 space-y-6 sm:mt-8">
          <div v-for="(key, i) in reasons" :key="key" class="flex gap-5 border-t border-stone-300 pt-6">
            <div class="font-serif text-2xl text-rose-400">0{{ i + 1 }}</div>
            <div>
              <h3 class="font-semibold text-stone-900">{{ t(`home.why.${key}.title`) }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ t(`home.why.${key}.text`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="mx-auto mt-16 max-w-6xl px-4 sm:mt-24 sm:px-6">
      <div class="relative isolate overflow-hidden rounded-3xl bg-stone-900 px-6 py-14 text-center text-white sm:px-16 sm:py-20">
        <UnsplashImage
          photo="facialMassage"
          alt=""
          :aspect="16 / 7"
          sizes="(min-width: 1152px) 1104px, 100vw"
          class="absolute inset-0 -z-10 size-full opacity-40"
        />
        <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-stone-900/80 to-stone-900/30" />
        <h2 class="font-serif text-2xl font-medium sm:text-4xl">{{ t('home.ctaTitle') }}</h2>
        <p class="mx-auto mt-3 max-w-xl text-stone-200">{{ t('home.ctaText') }}</p>
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
