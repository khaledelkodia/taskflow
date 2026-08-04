<template>
  <component :is="icon" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Bug, Sparkles, Wrench, Headphones, Link2, Database, Palette, Settings
} from 'lucide-vue-next'
import type { TaskType } from '~/types'

const props = defineProps<{ type: TaskType }>()

const MAP: Record<TaskType, any> = {
  bug: Bug,
  feature: Sparkles,
  enhancement: Wrench,
  support: Headphones,
  integration: Link2,
  database: Database,
  ui_ux: Palette,
  infrastructure: Settings
}

const icon = computed(() => MAP[props.type] ?? Sparkles)
</script>
