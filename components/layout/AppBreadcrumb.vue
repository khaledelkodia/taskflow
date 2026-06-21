<template>
  <nav class="flex items-center gap-1 text-sm min-w-0">
    <template v-for="(crumb, i) in crumbs" :key="crumb.label">
      <span v-if="i > 0" class="text-white/60 mx-0.5">/</span>
      <NuxtLink
        v-if="crumb.to && i < crumbs.length - 1"
        :to="crumb.to"
        class="text-white/80 hover:text-white transition-colors truncate"
      >
        {{ crumb.label }}
      </NuxtLink>
      <span v-else class="text-white font-medium truncate">
        {{ crumb.label }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types'

const route = useRoute()

const routeMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard':   [{ label: 'Dashboard' }],
  '/tasks':       [{ label: 'Tasks' }],
  '/projects':    [{ label: 'Projects' }],
  '/clients':     [{ label: 'Clients' }],
  '/admin/users': [{ label: 'Admin', to: '/dashboard' }, { label: 'Users' }]
}

const crumbs = computed<BreadcrumbItem[]>(() => {
  const path = route.path
  if (routeMap[path]) return routeMap[path]

  // Dynamic: /tasks/[id], /clients/[id], etc.
  const parts = path.split('/').filter(Boolean)
  if (parts.length >= 2) {
    const base = '/' + parts[0]
    const baseLabel = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const meta = route.meta?.breadcrumb as string | undefined
    return [
      { label: baseLabel, to: base },
      { label: meta ?? 'Detail' }
    ]
  }
  return [{ label: 'TaskFlow' }]
})
</script>
