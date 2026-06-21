<template>
  <aside
    :class="[
      'sidebar-container',
      collapsed ? 'w-16' : 'w-60'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
      <NuxtLink to="/dashboard" class="flex items-center gap-2.5 min-w-0">
        <div class="logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
            <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
            <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
            <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
          </svg>
        </div>
        <Transition name="fade-fast">
          <span v-if="!collapsed" class="font-bold text-white text-base tracking-tight">
            TaskFlow
          </span>
        </Transition>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
      <template v-for="item in navItems" :key="item.to">
        <NuxtLink
          :to="item.to"
          :title="collapsed ? item.label : undefined"
          :class="[
            'sidebar-nav-item group relative',
            isActive(item.to)
              ? 'sidebar-nav-active'
              : 'sidebar-nav-default'
          ]"
        >
          <!-- Icon -->
          <span class="shrink-0 w-5 h-5 flex items-center justify-center">
            <component :is="getIcon(item.icon)" class="w-[18px] h-[18px]" />
          </span>

          <!-- Label -->
          <Transition name="fade-fast">
            <span v-if="!collapsed" class="truncate text-sm">{{ $t('nav.' + item.label.toLowerCase()) }}</span>
          </Transition>

          <!-- Active indicator -->
          <span
            v-if="isActive(item.to)"
            class="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-e-full"
            style="background: linear-gradient(180deg, #60A5FA, #A78BFA);"
          />

          <!-- Tooltip (collapsed) -->
          <div
            v-if="collapsed"
            class="absolute start-full ms-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs
                   rounded-md opacity-0 pointer-events-none group-hover:opacity-100
                   transition-opacity duration-150 whitespace-nowrap z-50 shadow-dropdown"
          >
            {{ $t('nav.' + item.label.toLowerCase()) }}
          </div>
        </NuxtLink>
      </template>
    </nav>

    <!-- User section -->
    <div class="border-t border-white/10 p-2 shrink-0">
      <div
        class="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-150"
        @click="authStore.logout()"
        :title="collapsed ? `${profile?.full_name} — Sign out` : undefined"
      >
        <UiAvatar
          :name="profile?.full_name ?? 'User'"
          size="sm"
          class="shrink-0"
        />
        <Transition name="fade-fast">
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="text-sm font-medium text-white/90 truncate leading-tight">
              {{ profile?.full_name }}
            </p>
            <p class="text-xs text-white/40 truncate">
              {{ roleLabel }}
            </p>
          </div>
        </Transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  LayoutDashboard, CheckSquare, FolderOpen, Users, Building2
} from 'lucide-vue-next'
import { getNavItems } from '~/utils/permissions'
import { ROLE_LABELS } from '~/utils/constants'

const props = defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const route = useRoute()
const authStore = useAuthStore()
const profile = computed(() => authStore.profile)
const roleLabel = computed(() =>
  profile.value ? ROLE_LABELS[profile.value.role] : ''
)

const navItems = computed(() =>
  profile.value ? getNavItems(profile.value.role) : []
)

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

const iconMap: Record<string, any> = {
  dashboard: LayoutDashboard,
  tasks: CheckSquare,
  projects: FolderOpen,
  clients: Building2,
  users: Users
}

function getIcon(name: string) {
  return iconMap[name] ?? LayoutDashboard
}
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-shrink: 0;
  transition: width 0.2s ease-out;
  background: linear-gradient(180deg, #0f1729 0%, #1a2744 100%);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sidebar-nav-default {
  color: rgba(255, 255, 255, 0.5);
}
.sidebar-nav-default:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-nav-active {
  color: #ffffff;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(124, 58, 237, 0.15));
}

.fade-fast-enter-active,
.fade-fast-leave-active { transition: opacity 0.15s ease; }
.fade-fast-enter-from,
.fade-fast-leave-to { opacity: 0; }
</style>
