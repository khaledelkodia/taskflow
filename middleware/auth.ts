export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  // Skip portal and login routes
  if (to.path.startsWith('/portal') || to.path === '/login') return
  if (!user.value) return navigateTo('/login')
})
