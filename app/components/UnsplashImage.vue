<script setup lang="ts">
import { photos, type PhotoKey } from '~/data/photos'

const props = withDefaults(defineProps<{
  photo: PhotoKey
  alt: string
  /** width / height, e.g. 4/3. Crops the image and reserves space (no layout shift) */
  aspect: number
  /** `sizes` attribute - how wide the image is rendered at each breakpoint */
  sizes?: string
  widths?: number[]
  /** true for above-the-fold images (hero) */
  priority?: boolean
}>(), {
  sizes: '100vw',
  widths: () => [320, 480, 640, 800, 1080, 1280, 1600],
  priority: false,
})

const id = computed(() => photos[props.photo].id)
const fallbackWidth = computed(() => props.widths[Math.floor(props.widths.length / 2)]!)
</script>

<template>
  <img
    :src="unsplashUrl(id, fallbackWidth, aspect)"
    :srcset="unsplashSrcset(id, widths, aspect)"
    :sizes="sizes"
    :alt="alt"
    :width="fallbackWidth"
    :height="Math.round(fallbackWidth / aspect)"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : undefined"
    decoding="async"
    class="bg-stone-200 object-cover"
  >
</template>
