<script setup lang="ts">
const { t, locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const route = useRoute()
const { user, isAdmin, logout } = useAdminAuth()

useSeoMeta({ robots: 'noindex, nofollow' })

// Signed out (here or in another tab) while on a protected page -> back to login
watch(user, (u) => {
  if (!u && !route.path.endsWith('/admin/login')) navigateTo(localePath('/admin/login'))
})

async function signOut() {
  await logout()
  await navigateTo(localePath('/admin/login'))
}
</script>

<template>
  <div class="min-h-screen bg-stone-100">
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <NuxtLinkLocale to="/admin" class="font-serif text-lg font-semibold text-stone-900">
          Aura <span class="text-rose-500">Beauty</span>
          <span class="ml-1 rounded-md bg-stone-900 px-1.5 py-0.5 align-middle font-sans text-[11px] font-semibold uppercase tracking-wider text-white">
            {{ t('admin.badge') }}
          </span>
        </NuxtLinkLocale>

        <div class="ml-auto flex items-center gap-2 text-sm">
          <div class="flex rounded-full bg-stone-100 p-0.5 text-xs font-semibold">
            <NuxtLink
              v-for="l in locales"
              :key="l.code"
              :to="switchLocalePath(l.code)"
              class="flex min-h-8 min-w-9 items-center justify-center rounded-full px-2.5 uppercase"
              :class="l.code === locale ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'"
            >
              {{ l.code }}
            </NuxtLink>
          </div>
          <NuxtLinkLocale to="/" class="hidden rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100 sm:block">
            {{ t('admin.viewSite') }}
          </NuxtLinkLocale>
          <template v-if="user && isAdmin">
            <span class="hidden max-w-48 truncate text-stone-500 md:block">{{ user.email }}</span>
            <button type="button" class="rounded-lg px-3 py-2 font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50" @click="signOut">
              {{ t('admin.signOut') }}
            </button>
          </template>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <slot />
    </main>
  </div>
</template>
