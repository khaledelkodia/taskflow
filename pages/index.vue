<template>
  <div class="flex items-center justify-center h-screen bg-app-bg">
    <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      return navigateTo('/dashboard')
    }
  ]
})
</script>
