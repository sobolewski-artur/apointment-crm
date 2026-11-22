<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()

useHead({ title: () => t('app.title') })
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
    <div class="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('app.welcome') }}</h1>
      <p class="mt-3 text-slate-600">{{ t('app.description') }}</p>

      <div class="mt-6 flex items-center gap-3">
        <span class="text-sm font-medium text-slate-500">{{ t('app.language') }}:</span>
        <button
          v-for="l in locales"
          :key="l.code"
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
          :class="l.code === locale
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="setLocale(l.code)"
        >
          {{ l.name }}
        </button>
      </div>
    </div>
  </main>
</template>
