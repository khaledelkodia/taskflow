<template>
  <UiCard title="Tasks by Status" class="h-full flex flex-col">
    <div class="flex-1 min-h-[300px] flex items-center justify-center p-4 relative">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
      
      <Doughnut
        v-if="chartData && !isEmpty"
        :data="chartData"
        :options="chartOptions"
        class="max-h-[300px]"
      />
      
      <div v-else-if="!loading && isEmpty" class="text-center text-content-muted">
        <p>No tasks found.</p>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '~/utils/constants'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: { status: string; count: number }[]
  loading?: boolean
}>()

const isEmpty = computed(() => !props.data || props.data.length === 0 || props.data.every(d => d.count === 0))

// Map our custom tailwind classes to hex colors for Chart.js
const colorMap: Record<string, string> = {
  'badge-gray': '#94A3B8',
  'badge-blue': '#3B82F6',
  'badge-indigo': '#6366F1',
  'badge-purple': '#A855F7',
  'badge-orange': '#F97316',
  'badge-yellow': '#EAB308',
  'badge-green': '#10B981',
  'badge-red': '#EF4444'
}

const chartData = computed(() => {
  if (!props.data) return null
  
  // Filter out statuses with 0 count for cleaner chart
  const activeData = props.data.filter(d => d.count > 0)
  
  return {
    labels: activeData.map(d => TASK_STATUS_LABELS[d.status as keyof typeof TASK_STATUS_LABELS] || d.status),
    datasets: [
      {
        data: activeData.map(d => d.count),
        backgroundColor: activeData.map(d => {
          const badgeClass = TASK_STATUS_COLORS[d.status as keyof typeof TASK_STATUS_COLORS]
          return colorMap[badgeClass] || '#94A3B8'
        }),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'Inter',
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleFont: { family: 'Inter', size: 13 },
      bodyFont: { family: 'Inter', size: 13 },
      padding: 12,
      cornerRadius: 8,
      displayColors: true
    }
  },
  cutout: '65%'
}
</script>
