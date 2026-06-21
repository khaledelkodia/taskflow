<template>
  <div class="flex h-screen overflow-hidden bg-app-bg">
    <!-- Sidebar -->
    <LayoutAppSidebar
      :collapsed="sidebarCollapsed"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
    />

    <!-- Main content -->
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <!-- Header -->
      <LayoutAppHeader @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed" />

      <!-- Page -->
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-screen-2xl mx-auto px-6 py-6">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = ref(false)

// Restore sidebar state from localStorage
onMounted(() => {
  const saved = localStorage.getItem('taskflow:sidebar-collapsed')
  if (saved !== null) sidebarCollapsed.value = saved === 'true'
})

watch(sidebarCollapsed, (v) => {
  localStorage.setItem('taskflow:sidebar-collapsed', String(v))
})
</script>
