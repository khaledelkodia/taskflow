<template>
  <div dir="ltr" class="relative min-h-screen overflow-x-hidden bg-[#140D1C] text-[#FAF5FF] font-sans">
    <!-- Ambient premium background -->
    <div class="pointer-events-none fixed inset-0 z-0">
      <div class="absolute -top-40 -right-32 w-[40rem] h-[40rem] rounded-full bg-fuchsia-600/20 blur-[140px]" />
      <div class="absolute top-1/3 -left-40 w-[36rem] h-[36rem] rounded-full bg-violet-700/20 blur-[150px]" />
      <div class="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full bg-[#C8A45C]/10 blur-[150px]" />
      <div class="absolute inset-0 opacity-[0.04]" style="background-image:radial-gradient(#fff 1px,transparent 1px);background-size:22px 22px" />
    </div>

    <!-- Header -->
    <header class="relative z-20 sticky top-0 border-b border-white/10 bg-[#140D1C]/70 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-violet-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
            </svg>
          </div>
          <span class="font-bold text-white text-base tracking-tight">Client Portal</span>
        </div>

        <div v-if="client" class="text-sm font-semibold text-fuchsia-100 bg-white/5 px-4 py-1.5 rounded-full border border-fuchsia-400/20">
          {{ client.company_name }}
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="relative z-10 w-full max-w-6xl mx-auto px-6 py-10">
      <div v-if="loading" class="flex justify-center py-24">
        <div class="animate-spin w-9 h-9 border-[3px] border-fuchsia-500/30 border-t-fuchsia-400 rounded-full" />
      </div>

      <div v-else-if="!client" class="text-center py-24 max-w-md mx-auto">
        <div class="w-16 h-16 bg-rose-500/10 text-rose-300 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-400/20">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Invalid Access Link</h2>
        <p class="text-sm text-zinc-400">This portal link is invalid or has expired. Please contact your project manager for a new link.</p>
      </div>

      <div v-else class="space-y-10">
        <!-- Hero / Overview -->
        <section class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#231630] to-[#1A1024] shadow-2xl shadow-black/40">
          <div class="absolute -top-24 -right-10 w-72 h-72 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
          <div class="relative p-8 flex flex-col lg:flex-row items-center gap-10">
            <!-- Completion ring -->
            <div class="relative shrink-0">
              <svg viewBox="0 0 120 120" class="w-36 h-36 -rotate-90">
                <circle cx="60" cy="60" :r="RING_R" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" />
                <circle
                  cx="60" cy="60" :r="RING_R" fill="none" stroke="url(#ringGrad)" stroke-width="10" stroke-linecap="round"
                  :stroke-dasharray="ringCirc" :stroke-dashoffset="ringOffset"
                  class="transition-all duration-[1200ms] ease-out"
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#C084FC" />
                    <stop offset="100%" stop-color="#E879F9" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-extrabold text-white leading-none">{{ completionPercentage }}<span class="text-xl text-fuchsia-300">%</span></span>
                <span class="text-[11px] uppercase tracking-widest text-zinc-400 mt-1">Completed</span>
              </div>
            </div>

            <!-- Stat tiles -->
            <div class="flex-1 w-full">
              <h2 class="text-lg font-semibold text-white/90 mb-5 flex items-center gap-2">
                <span class="w-1.5 h-5 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-500" />
                Project Progress Overview
              </h2>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div v-for="stat in heroStats" :key="stat.label" class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center hover:bg-white/[0.06] transition-colors">
                  <p class="text-2xl font-bold" :class="stat.color">{{ stat.value }}</p>
                  <p class="text-[11px] text-zinc-400 mt-1.5 uppercase tracking-wider font-medium">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Projects -->
        <section>
          <h2 class="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
            <span class="w-1.5 h-6 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-500" />
            Your Projects
          </h2>

          <div v-if="!projectGroups.length" class="text-center py-16 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
            <p class="text-zinc-400">No projects yet.</p>
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="group in projectGroups"
              :key="group.key"
              class="rounded-3xl border border-white/10 bg-[#1B1226]/80 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/30 hover:border-fuchsia-400/25 transition-colors"
            >
              <!-- Project header -->
              <div class="p-6 border-b border-white/10">
                <div class="flex items-start justify-between gap-4 mb-5">
                  <div class="min-w-0 flex items-start gap-4">
                    <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-500/25 to-violet-500/25 border border-fuchsia-400/20 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-fuchsia-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-3 flex-wrap">
                        <h3 class="text-lg font-bold text-white truncate">{{ group.name }}</h3>
                        <span v-if="group.status" class="text-[11px] font-semibold px-2.5 py-1 rounded-full border" :class="projectChip(group.status)">
                          {{ getProjectStatusLabel(group.status) }}
                        </span>
                      </div>
                      <p class="text-xs text-zinc-400 mt-1.5">{{ group.done }} of {{ group.total }} tasks completed</p>
                    </div>
                  </div>
                  <div class="text-end shrink-0">
                    <span class="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">{{ group.percent }}%</span>
                  </div>
                </div>
                <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-fuchsia-500 to-violet-500 rounded-full transition-all duration-700" :style="`width: ${group.percent}%`" />
                </div>
              </div>

              <!-- Tasks -->
              <div class="divide-y divide-white/[0.06]">
                <button
                  v-for="task in group.tasks"
                  :key="task.id"
                  @click="openTask(task)"
                  class="w-full text-start p-5 flex items-center gap-4 hover:bg-white/[0.03] transition-colors group"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2.5 mb-2">
                      <span class="text-[11px] font-bold text-zinc-500 tracking-wider">{{ formatTaskNumber(task.task_number) }}</span>
                      <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border" :class="statusChip(task.status)">
                        {{ getPortalStatusLabel(task.status) }}
                      </span>
                    </div>
                    <p class="text-sm sm:text-base font-semibold text-white/95 truncate group-hover:text-fuchsia-200 transition-colors">{{ task.title }}</p>

                    <!-- Premium date pill (bronze) -->
                    <div class="mt-3 inline-flex items-center gap-2 ps-2.5 pe-3 py-1.5 rounded-xl bg-[#D9B871]/10 border border-[#D9B871]/30">
                      <svg class="w-4 h-4 text-[#E7CE97] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span class="text-sm font-bold text-[#EBD7A6] tracking-wide">{{ formatPortalDueDate(task.due_date) }}</span>
                    </div>
                  </div>
                  <svg class="w-5 h-5 text-zinc-600 group-hover:text-fuchsia-300 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Task Detail Modal (custom, themed) -->
    <Teleport to="body">
      <Transition name="portal-fade">
        <div v-if="selectedTask" dir="ltr" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closeTask" />

          <div class="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-fuchsia-400/15 bg-[#1A1024] shadow-2xl shadow-black/60 text-[#FAF5FF]">
            <!-- Modal header -->
            <div class="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4 shrink-0">
              <div class="min-w-0">
                <div class="flex items-center gap-2.5 mb-1.5">
                  <span class="text-[11px] font-bold text-zinc-500 tracking-wider">{{ formatTaskNumber(selectedTask.task_number) }}</span>
                  <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border" :class="statusChip(selectedTask.status)">
                    {{ getPortalStatusLabel(selectedTask.status) }}
                  </span>
                </div>
                <h2 class="text-lg font-bold text-white leading-snug">{{ selectedTask.title }}</h2>
              </div>
              <button class="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0" @click="closeTask">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </button>
            </div>

            <!-- Modal body -->
            <div class="p-6 overflow-y-auto space-y-6">
              <p class="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {{ selectedTask.description || 'No description provided.' }}
              </p>

              <div class="grid sm:grid-cols-2 gap-4">
                <div class="rounded-2xl border border-[#D9B871]/25 bg-[#D9B871]/10 p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-[#D9B871]/15 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-[#E7CE97]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] text-zinc-400 mb-0.5 font-medium uppercase tracking-wider">Expected Completion</p>
                    <p class="text-base font-bold text-[#EBD7A6]">{{ formatPortalDueDate(selectedTask.due_date) }}</p>
                  </div>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] text-zinc-400 mb-0.5 font-medium uppercase tracking-wider">Last Update</p>
                    <p class="text-base font-semibold text-white">{{ formatRelative(selectedTask.updated_at) }}</p>
                  </div>
                </div>
              </div>

              <!-- Discussion -->
              <div class="border-t border-white/10 pt-6">
                <h3 class="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-fuchsia-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Discussion
                </h3>

                <div v-if="commentsLoading" class="py-6 text-center">
                  <div class="inline-block animate-spin w-5 h-5 border-2 border-fuchsia-400/40 border-t-fuchsia-400 rounded-full" />
                </div>

                <div v-else class="space-y-4">
                  <p v-if="!portalComments.length" class="text-sm text-zinc-500 text-center py-4">No comments yet. Start the discussion!</p>

                  <div v-for="c in portalComments" :key="c.id" class="flex gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      :class="c.is_client ? 'bg-gradient-to-tr from-fuchsia-500 to-violet-500 text-white' : 'bg-white/10 text-zinc-300'">
                      {{ initials(c.author_name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-baseline gap-2 mb-1">
                        <span class="font-semibold text-white text-sm">{{ c.author_name }}</span>
                        <span v-if="c.is_client" class="text-[11px] text-fuchsia-300 font-medium">Client</span>
                        <span class="text-[11px] text-zinc-500">{{ formatRelative(c.created_at) }}</span>
                      </div>
                      <div class="p-3 rounded-2xl text-sm whitespace-pre-wrap break-words border"
                        :class="c.is_client ? 'bg-fuchsia-500/10 border-fuchsia-400/20 text-fuchsia-50' : 'bg-white/[0.04] border-white/10 text-zinc-200'">
                        {{ c.content }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Add comment -->
                <div class="mt-6 pt-4 border-t border-white/10 space-y-3">
                  <input
                    v-model="commentAuthor"
                    type="text"
                    class="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20 transition"
                    placeholder="Enter your name"
                  />
                  <textarea
                    v-model="newComment"
                    rows="3"
                    class="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20 transition resize-none"
                    placeholder="Write a comment..."
                  />
                  <p v-if="commentError" class="text-sm text-rose-400">{{ commentError }}</p>
                  <div class="flex justify-end">
                    <button
                      :disabled="!newComment.trim() || posting"
                      @click="postComment"
                      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-violet-500 shadow-lg shadow-fuchsia-500/25 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <span v-if="posting" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatTaskNumber, formatRelative, formatDate, getInitials } from '~/utils/formatters'
import { PROJECT_STATUS_LABELS } from '~/utils/constants'
import type { Client, Project, Task, Comment, ProjectStatus } from '~/types'

definePageMeta({
  layout: 'portal'
})

const route = useRoute()
const token = route.params.token as string

const clientsStore = useClientsStore()
const tasksStore = useTasksStore()

const loading = ref(true)
const client = ref<Client | null>(null)
const projects = ref<Project[]>([])
const tasks = ref<Task[]>([])

const selectedTaskId = ref<string | null>(null)
const selectedTask = computed(() => tasks.value.find((t) => t.id === selectedTaskId.value) || null)

// ─── Comments (portal, public only) ──────────────────────
const portalComments = ref<Comment[]>([])
const commentsLoading = ref(false)
const newComment = ref('')
const commentAuthor = ref('')
const posting = ref(false)
const commentError = ref('')

function initials(name: string) {
  return getInitials(name || 'C')
}

// ─── Simplified statuses for clients ─────────────────────
function getPortalStatusLabel(status: string) {
  if (['new', 'under_review', 'approved'].includes(status)) return 'Pending'
  if (['assigned', 'in_progress', 'development_completed'].includes(status)) return 'In Progress'
  if (status === 'testing') return 'Testing'
  if (status === 'waiting_client_feedback') return 'Action Required'
  if (status === 'completed') return 'Completed'
  return 'Cancelled'
}

// Translucent glass chips tuned for the plum theme
function statusChip(status: string) {
  if (['new', 'under_review', 'approved'].includes(status)) return 'bg-zinc-500/15 text-zinc-300 border-zinc-400/20'
  if (['assigned', 'in_progress', 'development_completed'].includes(status)) return 'bg-violet-500/15 text-violet-200 border-violet-400/25'
  if (status === 'testing') return 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/25'
  if (status === 'waiting_client_feedback') return 'bg-amber-500/15 text-amber-200 border-amber-400/25'
  if (status === 'completed') return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25'
  return 'bg-rose-500/15 text-rose-200 border-rose-400/25'
}

function getProjectStatusLabel(status: ProjectStatus) {
  return PROJECT_STATUS_LABELS[status] ?? status
}
function projectChip(status: ProjectStatus) {
  const map: Record<ProjectStatus, string> = {
    active: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/25',
    on_hold: 'bg-amber-500/15 text-amber-200 border-amber-400/25',
    completed: 'bg-violet-500/15 text-violet-200 border-violet-400/25',
    cancelled: 'bg-zinc-500/15 text-zinc-300 border-zinc-400/20'
  }
  return map[status] ?? 'bg-zinc-500/15 text-zinc-300 border-zinc-400/20'
}

function formatPortalDueDate(dueDate: string | null | undefined) {
  return dueDate ? formatDate(dueDate) : 'Not scheduled'
}

// ─── Overall stats ───────────────────────────────────────
const activeCount = computed(() => tasks.value.filter((t) => ['assigned', 'in_progress', 'development_completed', 'testing'].includes(t.status)).length)
const reviewCount = computed(() => tasks.value.filter((t) => t.status === 'waiting_client_feedback').length)
const completedCount = computed(() => tasks.value.filter((t) => t.status === 'completed').length)
const completionPercentage = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round((completedCount.value / tasks.value.length) * 100)
})

const heroStats = computed(() => [
  { label: 'Projects', value: projects.value.length, color: 'text-white' },
  { label: 'Total Tasks', value: tasks.value.length, color: 'text-white' },
  { label: 'In Progress', value: activeCount.value, color: 'text-violet-300' },
  { label: 'Needs Review', value: reviewCount.value, color: 'text-amber-300' },
  { label: 'Completed', value: completedCount.value, color: 'text-emerald-300' }
])

// ─── Completion ring geometry ────────────────────────────
const RING_R = 52
const ringCirc = 2 * Math.PI * RING_R
const ringOffset = computed(() => ringCirc * (1 - completionPercentage.value / 100))

// ─── Group tasks by project ──────────────────────────────
const projectGroups = computed(() => {
  const groups: Array<{ key: string; name: string; status: ProjectStatus | null; tasks: Task[]; done: number; total: number; percent: number }> = []

  for (const project of projects.value) {
    const projectTasks = tasks.value.filter((t) => t.project_id === project.id)
    const done = projectTasks.filter((t) => t.status === 'completed').length
    const total = projectTasks.length
    groups.push({
      key: project.id,
      name: project.name,
      status: project.status,
      tasks: projectTasks,
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0
    })
  }

  const orphanTasks = tasks.value.filter((t) => !t.project_id)
  if (orphanTasks.length) {
    const done = orphanTasks.filter((t) => t.status === 'completed').length
    groups.push({
      key: '__general__',
      name: 'General Tasks',
      status: null,
      tasks: orphanTasks,
      done,
      total: orphanTasks.length,
      percent: orphanTasks.length ? Math.round((done / orphanTasks.length) * 100) : 0
    })
  }

  return groups
})

// ─── Task modal + comments ───────────────────────────────
async function openTask(task: Task) {
  selectedTaskId.value = task.id
  commentError.value = ''
  newComment.value = ''
  commentAuthor.value = client.value?.contact_person ?? ''
  commentsLoading.value = true
  try {
    portalComments.value = await tasksStore.fetchPortalComments(token, task.id)
  } catch (err) {
    console.error('Failed to load comments', err)
    portalComments.value = []
  } finally {
    commentsLoading.value = false
  }
}

function closeTask() {
  selectedTaskId.value = null
  portalComments.value = []
}

async function postComment() {
  if (!newComment.value.trim() || posting.value || !selectedTaskId.value) return
  posting.value = true
  commentError.value = ''
  try {
    const created = await tasksStore.addPortalComment(
      token,
      selectedTaskId.value,
      newComment.value.trim(),
      commentAuthor.value.trim()
    )
    if (created) portalComments.value.push(created)
    newComment.value = ''
  } catch (err) {
    console.error('Failed to post comment', err)
    commentError.value = 'Could not send your comment. Please try again.'
  } finally {
    posting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await clientsStore.fetchClientByToken(token)
    if (data) {
      client.value = data
      const [proj, tsk] = await Promise.all([
        clientsStore.fetchProjectsByClientToken(token),
        tasksStore.fetchTasksByClientToken(token)
      ])
      projects.value = proj
      tasks.value = tsk
    }
  } catch (err) {
    console.error('Portal load failed', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.portal-fade-enter-active,
.portal-fade-leave-active { transition: opacity 0.25s ease; }
.portal-fade-enter-from,
.portal-fade-leave-to { opacity: 0; }
</style>
