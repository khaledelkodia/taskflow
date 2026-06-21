<template>
  <UiCard title="Tasks by Priority" class="h-full flex flex-col">
    <div class="flex-1 min-h-[300px] flex items-center justify-center p-4 relative">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
        <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
      
      <Bar
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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { PRIORITY_LABELS, PRIORITY_COLORS } from '~/utils/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  data: { priority: string; count: number }[]
  loading?: boolean
}>()

const isEmpty = computed(() => !props.data || props.data.length === 0 || props.data.every(d => d.count === 0))

const colorMap: Record<string, string> = {
  'badge-red': '#EF4444',
  'badge-yellow': '#F59E0B',
  'badge-blue': '#3B82F6',
  'badge-green': '#10B981'
}

const chartData = computed(() => {
  if (!props.data) return null
  
  // Enforce order: critical, high, medium, low
  const order = ['critical', 'high', 'medium', 'low']
  const sortedData = [...props.data].sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority))
  
  return {
    labels: sortedData.map(d => PRIORITY_LABELS[d.priority as keyof typeof PRIORITY_LABELS] || d.priority),
    datasets: [
      {
        label: 'Tasks',
        data: sortedData.map(d => d.count),
        backgroundColor: sortedData.map(d => {
          const badgeClass = PRIORITY_COLORS[d.priority as keyof typeof PRIORITY_COLORS]
          return colorMap[badgeClass] || '#94A3B8'
        }),
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#0F172A',
      titleFont: { family: 'Inter', size: 13 },
      bodyFont: { family: 'Inter', size: 13 },
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#F1F5F9',
        drawBorder: false
      },
      ticks: {
        stepSize: 1,
        font: { family: 'Inter' }
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        font: { family: 'Inter' }
      }
    }
  }
}
</script>
