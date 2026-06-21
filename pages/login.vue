<template>
  <div class="w-full max-w-md bg-white rounded-xl shadow-card-lg border border-app-border p-8">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-500 mb-4 shadow-md">
        <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
          <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
          <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-content-primary tracking-tight">{{ $t('login.welcome') }}</h1>
      <p class="text-sm text-content-secondary mt-2">{{ $t('login.subtitle') }}</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-5">
      <div class="form-group">
        <label for="email" class="label">{{ $t('login.email') }}</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="input"
          placeholder="admin@taskflow.io"
          required
          autofocus
        />
      </div>

      <div class="form-group">
        <div class="flex items-center justify-between mb-1.5">
          <label for="password" class="block text-sm font-medium text-content-primary">{{ $t('login.password') }}</label>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          class="input"
          placeholder="••••••••"
          required
        />
      </div>

      <div v-if="error" class="p-3 bg-danger-50 border border-danger/20 rounded-md">
        <p class="text-sm text-danger-600">{{ error }}</p>
      </div>

      <UiButton
        type="submit"
        variant="primary"
        size="lg"
        block
        :loading="loading"
        class="mt-6"
      >
        {{ $t('login.signIn') }}
      </UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { t } = useI18n()
const authStore = useAuthStore()

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.message || t('login.failedSignIn')
  } finally {
    loading.value = false
  }
}
</script>
