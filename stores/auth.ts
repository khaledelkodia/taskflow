import { defineStore } from 'pinia'
import type { Profile, UserRole } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  // ─── Computed ───────────────────────────────────────────
  const isAuthenticated = computed(() => !!user.value)
  const role = computed<UserRole | null>(() => profile.value?.role ?? null)
  const isAdmin = computed(() => profile.value?.role === 'super_admin')
  const isPM = computed(() => profile.value?.role === 'project_manager')
  const isSales = computed(() => profile.value?.role === 'sales')
  const isDeveloper = computed(() => profile.value?.role === 'developer')
  const isTester = computed(() => profile.value?.role === 'tester')

  // ─── Actions ────────────────────────────────────────────
  async function fetchProfile() {
    if (!user.value) return
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      if (!error && data) profile.value = data as Profile
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await fetchProfile()
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    profile.value = null
    navigateTo('/login')
  }

  async function updateProfile(updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>) {
    if (!user.value) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
      .select()
      .single()
    if (!error && data) profile.value = data as Profile
  }

  // Watch auth user changes
  watch(user, async (newUser) => {
    if (newUser && !profile.value) await fetchProfile()
    else if (!newUser) profile.value = null
  }, { immediate: true })

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    role,
    isAdmin,
    isPM,
    isSales,
    isDeveloper,
    isTester,
    fetchProfile,
    login,
    logout,
    updateProfile
  }
})
