<script setup lang="ts">
import { photos, type Photo, type PhotoKey } from '~/data/photos'

const { t } = useI18n()

useHead({ title: () => t('credits.title') })

const list = (Object.entries(photos) as [PhotoKey, Photo][])
  .map(([key, photo]) => ({ key, ...photo }))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
    <h1 class="font-serif text-3xl font-medium text-stone-900 sm:text-4xl">{{ t('credits.title') }}</h1>
    <p class="mt-3 text-stone-600">
      {{ t('credits.subtitle') }}
      <a href="https://unsplash.com/?utm_source=aura_beauty&utm_medium=referral" target="_blank" rel="noopener" class="font-semibold text-rose-600 hover:text-rose-700">Unsplash</a>.
    </p>

    <ul class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
      <li v-for="photo in list" :key="photo.id">
        <a :href="unsplashPhotoPage(photo.slug)" target="_blank" rel="noopener" class="group block overflow-hidden rounded-2xl">
          <UnsplashImage
            :photo="photo.key"
            :alt="t('credits.by', { author: photo.author })"
            :aspect="1"
            :widths="[240, 360, 480]"
            sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw"
            class="aspect-square w-full transition duration-500 group-hover:scale-105"
          />
        </a>
        <p class="mt-2 text-sm text-stone-600">
          {{ t('credits.photoBy') }}
          <a :href="unsplashProfile(photo.username)" target="_blank" rel="noopener" class="font-medium text-stone-900 hover:text-rose-600">{{ photo.author }}</a>
        </p>
      </li>
    </ul>
  </div>
</template>
