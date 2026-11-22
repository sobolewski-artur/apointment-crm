/** Guards admin pages. Real protection is in firestore.rules - this only handles navigation. */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return // admin routes are client-only (routeRules ssr: false)

  const { init, user, isAdmin } = useAdminAuth()
  await init()
  if (!user.value || !isAdmin.value) {
    return navigateTo(useNuxtApp().$localePath('/admin/login'))
  }
})
