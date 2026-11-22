<script setup lang="ts">
import { FirebaseError } from 'firebase/app'

definePageMeta({ layout: 'admin' })

const { t } = useI18n()
const localePath = useLocalePath()
const { init, isAdmin, signIn } = useAdminAuth()

useHead({ title: () => t('admin.login.title') })

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

// Already signed in as admin -> straight to the panel
onMounted(async () => {
  await init()
  if (isAdmin.value) await navigateTo(localePath('/admin'))
})

async function submit() {
  error.value = null
  submitting.value = true
  try {
    const ok = await signIn(email.value.trim(), password.value)
    if (!ok) {
      error.value = t('admin.login.errors.notAdmin')
      return
    }
    await navigateTo(localePath('/admin'))
  }
  catch (e) {
    const code = e instanceof FirebaseError ? e.code : ''
    if (code === 'auth/too-many-requests') {
      error.value = t('admin.login.errors.tooMany')
    }
    else if (['auth/invalid-credential', 'auth/invalid-email', 'auth/wrong-password', 'auth/user-not-found'].includes(code)) {
      error.value = t('admin.login.errors.invalid')
    }
    else {
      error.value = t('admin.login.errors.generic')
      console.error('[admin] sign-in failed', e)
    }
  }
  finally {
    submitting.value = false
  }
}

const inputClass = 'mt-1.5 block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-stone-900 ring-1 ring-stone-300 focus:ring-2 focus:ring-rose-400 focus:outline-none'
</script>

<template>
  <div class="mx-auto mt-6 max-w-sm sm:mt-16">
    <div class="rounded-2xl bg-white p-6 ring-1 ring-stone-200 sm:p-8">
      <h1 class="font-serif text-2xl font-medium text-stone-900">{{ t('admin.login.title') }}</h1>
      <p class="mt-1 text-sm text-stone-500">{{ t('admin.login.subtitle') }}</p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="text-sm font-medium text-stone-700">{{ t('admin.login.email') }}</span>
          <input v-model="email" type="email" autocomplete="username" required :class="inputClass">
        </label>
        <label class="block">
          <span class="text-sm font-medium text-stone-700">{{ t('admin.login.password') }}</span>
          <input v-model="password" type="password" autocomplete="current-password" required :class="inputClass">
        </label>
        <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60"
        >
          {{ submitting ? t('admin.login.signingIn') : t('admin.login.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>
