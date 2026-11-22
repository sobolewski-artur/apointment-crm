<script setup lang="ts">
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { count } = useCart()

const links = [
  { to: '/', label: 'nav.home' },
  { to: '/treatments', label: 'nav.treatments' },
  { to: '/booking', label: 'nav.booking' },
]
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
      <NuxtLinkLocale to="/" class="font-serif text-xl font-semibold tracking-tight text-stone-900">
        Aura <span class="text-rose-500">Beauty</span>
      </NuxtLinkLocale>

      <nav class="ml-8 hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex">
        <NuxtLinkLocale
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="transition hover:text-stone-900"
          exact-active-class="text-rose-600"
        >
          {{ t(link.label) }}
        </NuxtLinkLocale>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <div class="flex rounded-full bg-stone-200/60 p-0.5 text-xs font-semibold" :aria-label="t('nav.language')">
          <NuxtLink
            v-for="l in locales"
            :key="l.code"
            :to="switchLocalePath(l.code)"
            class="rounded-full px-2.5 py-1 uppercase transition"
            :class="l.code === locale ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'"
            :aria-current="l.code === locale ? 'true' : undefined"
          >
            {{ l.code }}
          </NuxtLink>
        </div>

        <NuxtLinkLocale
          to="/booking"
          class="relative rounded-full p-2 text-stone-700 transition hover:bg-stone-200/60"
          :aria-label="t('nav.cart')"
        >
          <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
          <span
            v-if="count"
            class="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white"
          >
            {{ count }}
          </span>
        </NuxtLinkLocale>
      </div>
    </div>

    <nav class="flex gap-6 overflow-x-auto px-4 pb-2.5 text-sm font-medium text-stone-600 md:hidden">
      <NuxtLinkLocale
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="whitespace-nowrap"
        exact-active-class="text-rose-600"
      >
        {{ t(link.label) }}
      </NuxtLinkLocale>
    </nav>
  </header>
</template>
