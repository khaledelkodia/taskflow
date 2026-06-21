import { canAccessPage } from '~/utils/permissions'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  const role = authStore.profile?.role
  
  if (!role) return // Let auth middleware handle this

  if (!canAccessPage(role, to.path)) {
    return navigateTo('/dashboard')
  }
})
