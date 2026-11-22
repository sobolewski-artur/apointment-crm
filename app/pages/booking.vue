<script setup lang="ts">
const { t } = useI18n()

useHead({ title: () => t('booking.title') })
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
    <h1 class="font-serif text-4xl font-medium text-stone-900">{{ t('booking.title') }}</h1>
    <p class="mt-3 text-stone-600">{{ t('booking.subtitle') }}</p>

    <!-- Depends on the browser: saved cart, local date/time, Firestore -->
    <ClientOnly>
      <BookingFlow class="mt-10" />
      <template #fallback>
        <div class="mt-10 animate-pulse text-sm text-stone-500">{{ t('booking.loading') }}</div>
      </template>
    </ClientOnly>
  </div>
</template>
