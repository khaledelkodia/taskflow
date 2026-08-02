<template>
  <header class="app-header">
    <!-- Sidebar toggle (mobile) -->
    <button
      class="btn-ghost btn-md p-2 -ml-2 lg:hidden"
      @click="emit('toggleSidebar')"
      aria-label="Toggle sidebar"
    >
      <Menu class="w-5 h-5" />
    </button>

    <!-- Breadcrumb -->
    <LayoutAppBreadcrumb class="flex-1 min-w-0" />

    <!-- Right actions -->
    <div class="flex items-center gap-2 shrink-0">

      <!-- Search (opens ⌘K palette) -->
      <button
        class="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-content-muted
               bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:text-primary
               transition-all duration-200 w-52"
        @click="palette.open()"
      >
        <Search class="w-3.5 h-3.5" />
        <span class="flex-1 text-start">{{ $t('common.search') }}</span>
        <kbd class="text-xs bg-gray-100 border border-gray-200 rounded px-1">{{ shortcutHint }}</kbd>
      </button>

      <!-- Search (mobile icon) -->
      <button
        class="btn-ghost btn-md p-2 md:hidden"
        @click="palette.open()"
        :aria-label="$t('common.search')"
      >
        <Search class="w-5 h-5" />
      </button>

      <!-- Notifications -->
      <div class="relative" ref="notifRef">
        <button
          class="btn-ghost btn-md p-2 relative"
          @click="notifOpen = !notifOpen"
          aria-label="Notifications"
        >
          <Bell class="w-5 h-5" />
          <span
            v-if="notifStore.unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"
          />
        </button>

        <!-- Notification dropdown -->
        <Transition name="slide-down">
          <div
            v-if="notifOpen"
            class="absolute end-0 top-full mt-2 w-80 bg-white border border-gray-200
                   rounded-xl shadow-dropdown z-50 overflow-hidden"
          >
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 class="text-sm font-semibold text-content-primary">{{ $t('notifications.title', 'Notifications') }}</h3>
              <button
                v-if="notifStore.unreadCount > 0"
                class="text-xs text-primary hover:underline"
                @click="notifStore.markAllAsRead()"
              >
                {{ $t('notifications.markAllRead', 'Mark all read') }}
              </button>
            </div>
            <div class="max-h-80 overflow-y-auto">
              <div
                v-if="!notifStore.notifications.length"
                class="px-4 py-8 text-center text-sm text-content-muted"
              >
                {{ $t('notifications.empty', 'No notifications') }}
              </div>
              <div
                v-for="n in notifStore.notifications"
                :key="n.id"
                :class="[
                  'flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0',
                  'cursor-pointer hover:bg-primary-50/50 transition-colors duration-100',
                  !n.is_read && 'bg-primary-50/30'
                ]"
                @click="handleNotifClick(n)"
              >
                <div
                  :class="[
                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                    n.is_read ? 'bg-gray-200' : 'bg-primary'
                  ]"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-content-primary leading-snug">{{ n.message }}</p>
                  <p class="text-xs text-content-muted mt-0.5">
                    {{ formatRelative(n.created_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Language Switcher -->
      <button
        class="btn-ghost btn-md px-3 font-semibold text-sm transition-colors"
        @click="toggleLanguage"
      >
        {{ locale === 'en' ? 'عربي' : 'EN' }}
      </button>

      <!-- User menu -->
      <div class="relative" ref="userRef">
        <button
          class="flex items-center rounded-full transition-transform hover:scale-105 focus:outline-none"
          @click="userOpen = !userOpen"
          :aria-label="authStore.profile?.full_name ?? 'User'"
        >
          <UiAvatar :name="authStore.profile?.full_name ?? 'User'" size="sm" class="cursor-pointer" />
        </button>

        <Transition name="slide-down">
          <div
            v-if="userOpen"
            class="absolute end-0 top-full mt-2 w-60 bg-white border border-gray-200
                   rounded-xl shadow-dropdown z-50 overflow-hidden"
          >
            <!-- Identity -->
            <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <UiAvatar :name="authStore.profile?.full_name ?? 'User'" size="md" />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-content-primary truncate">{{ authStore.profile?.full_name }}</p>
                <p class="text-xs text-content-muted truncate">{{ roleLabel }}</p>
              </div>
            </div>
            <!-- Actions -->
            <div class="p-1.5">
              <button
                v-if="canManageUsers"
                class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-content-secondary hover:bg-gray-50 hover:text-content-primary transition-colors text-start"
                @click="goToUsers"
              >
                <Users class="w-4 h-4 shrink-0" />
                {{ $t('nav.users') }}
              </button>
              <button
                class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-danger hover:bg-danger-50 transition-colors text-start"
                @click="logout"
              >
                <LogOut class="w-4 h-4 shrink-0" />
                {{ $t('common.signOut', 'Sign out') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bell, Search, Menu, LogOut, Users } from 'lucide-vue-next'
import { formatRelative } from '~/utils/formatters'
import { ROLE_LABELS } from '~/utils/constants'
import { hasPermission } from '~/utils/permissions'
import type { Notification } from '~/types'

const emit = defineEmits<{ toggleSidebar: [] }>()

const { locale, setLocale } = useI18n()
const authStore = useAuthStore()
const notifStore = useNotificationsStore()
const palette = useCommandPalette()

function toggleLanguage() {
  setLocale(locale.value === 'en' ? 'ar' : 'en')
}

const notifOpen = ref(false)
const userOpen = ref(false)
const notifRef = ref<HTMLElement>()
const userRef = ref<HTMLElement>()

onClickOutside(notifRef, () => { notifOpen.value = false })
onClickOutside(userRef, () => { userOpen.value = false })

const roleLabel = computed(() =>
  authStore.profile ? ROLE_LABELS[authStore.profile.role] : ''
)
const canManageUsers = computed(() => hasPermission(authStore.profile?.role, 'manage_users'))

// Show ⌘ on Mac, Ctrl elsewhere
const shortcutHint = computed(() => {
  if (import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)) return '⌘K'
  return 'Ctrl K'
})

function goToUsers() {
  userOpen.value = false
  navigateTo('/admin/users')
}

function logout() {
  userOpen.value = false
  authStore.logout()
}

onMounted(() => notifStore.fetchNotifications())

async function handleNotifClick(n: Notification) {
  await notifStore.markAsRead(n.id)
  notifOpen.value = false
  if (n.task_id) navigateTo(`/tasks/${n.task_id}`)
}
</script>

<style scoped>
.app-header {
  height: 4rem;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  gap: 1rem;
  flex-shrink: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
}

.slide-down-enter-active { transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-leave-active { transition: all 0.12s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
