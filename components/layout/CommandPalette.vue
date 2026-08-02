<template>
  <Teleport to="body">
    <Transition name="fade-fast">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" aria-hidden="true" @click="close" />

        <!-- Panel -->
        <Transition name="scale-in">
          <div
            v-if="isOpen"
            class="relative w-full max-w-xl bg-white rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[70vh]"
            role="dialog"
            aria-modal="true"
          >
            <!-- Search input -->
            <div class="flex items-center gap-3 px-4 h-14 border-b border-app-border shrink-0">
              <Search class="w-5 h-5 text-content-muted shrink-0" />
              <input
                ref="inputEl"
                v-model="query"
                type="text"
                class="flex-1 bg-transparent outline-none text-content-primary placeholder:text-content-muted text-[15px]"
                :placeholder="$t('search.placeholder', 'Search tasks, projects, clients…')"
                @keydown.down.prevent="move(1)"
                @keydown.up.prevent="move(-1)"
                @keydown.enter.prevent="selectActive()"
                @keydown.esc.prevent="close"
              />
              <div v-if="loading" class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full shrink-0" />
              <kbd v-else class="text-[11px] text-content-muted bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">Esc</kbd>
            </div>

            <!-- Results -->
            <div ref="listEl" class="overflow-y-auto py-2 flex-1">
              <template v-for="(group, gi) in groups" :key="group.key">
                <div v-if="group.items.length" class="px-2">
                  <p class="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
                    {{ group.label }}
                  </p>
                  <button
                    v-for="item in group.items"
                    :key="item.id"
                    type="button"
                    :data-idx="item._idx"
                    class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-start transition-colors"
                    :class="item._idx === activeIndex ? 'bg-primary-50 text-primary-700' : 'text-content-secondary hover:bg-gray-50'"
                    @click="run(item)"
                    @mousemove="activeIndex = item._idx"
                  >
                    <span
                      class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      :class="item._idx === activeIndex ? 'bg-white' : 'bg-gray-100'"
                    >
                      <component :is="item.icon" class="w-4 h-4" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm font-medium text-content-primary truncate">{{ item.label }}</span>
                      <span v-if="item.sublabel" class="block text-xs text-content-muted truncate">{{ item.sublabel }}</span>
                    </span>
                    <CornerDownLeft v-if="item._idx === activeIndex" class="w-3.5 h-3.5 text-content-muted shrink-0" />
                  </button>
                </div>
                <div v-if="group.items.length && gi < groups.length - 1" class="my-1 border-t border-gray-100" />
              </template>

              <!-- Empty state -->
              <div v-if="!flatItems.length && !loading" class="px-4 py-10 text-center">
                <p class="text-sm text-content-muted">
                  {{ query ? $t('search.noResults', 'No results found') : $t('search.startTyping', 'Start typing to search') }}
                </p>
              </div>
            </div>

            <!-- Footer hint -->
            <div class="hidden sm:flex items-center gap-4 px-4 h-9 border-t border-app-border bg-app-bg text-[11px] text-content-muted shrink-0">
              <span class="flex items-center gap-1"><kbd class="kbd-hint">↑</kbd><kbd class="kbd-hint">↓</kbd> {{ $t('search.navigate', 'Navigate') }}</span>
              <span class="flex items-center gap-1"><kbd class="kbd-hint">↵</kbd> {{ $t('search.select', 'Select') }}</span>
              <span class="flex items-center gap-1"><kbd class="kbd-hint">Esc</kbd> {{ $t('search.close', 'Close') }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  Search, CornerDownLeft, LayoutDashboard, CheckSquare,
  FolderOpen, Building2, Users
} from 'lucide-vue-next'
import { getNavItems, canAccessPage } from '~/utils/permissions'
import { formatTaskNumber } from '~/utils/formatters'

const { isOpen, close } = useCommandPalette()
const { t } = useI18n()
const supabase = useSupabaseClient()
const authStore = useAuthStore()

const inputEl = ref<HTMLInputElement>()
const listEl = ref<HTMLElement>()
const query = ref('')
const loading = ref(false)
const activeIndex = ref(0)

interface Item {
  id: string
  label: string
  sublabel?: string
  icon: any
  to: string
  _idx?: number
}

const navIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  tasks: CheckSquare,
  projects: FolderOpen,
  clients: Building2,
  users: Users
}

const role = computed(() => authStore.profile?.role)

// Navigation items (always available, filtered by search term)
const navResults = computed<Item[]>(() => {
  if (!role.value) return []
  const items = getNavItems(role.value).map((n) => ({
    id: 'nav-' + n.to,
    label: t('nav.' + n.label.toLowerCase()),
    icon: navIcons[n.icon] ?? LayoutDashboard,
    to: n.to
  }))
  const q = query.value.trim().toLowerCase()
  if (!q) return items
  return items.filter((i) => i.label.toLowerCase().includes(q))
})

const taskResults = ref<Item[]>([])
const projectResults = ref<Item[]>([])
const clientResults = ref<Item[]>([])

const groups = computed(() => {
  const g = [
    { key: 'nav', label: t('search.groups.navigation', 'Navigation'), items: navResults.value },
    { key: 'tasks', label: t('search.groups.tasks', 'Tasks'), items: taskResults.value },
    { key: 'projects', label: t('search.groups.projects', 'Projects'), items: projectResults.value },
    { key: 'clients', label: t('search.groups.clients', 'Clients'), items: clientResults.value }
  ]
  // Assign flat indices for keyboard navigation
  let idx = 0
  for (const grp of g) {
    for (const item of grp.items) item._idx = idx++
  }
  return g
})

const flatItems = computed<Item[]>(() => groups.value.flatMap((g) => g.items))

watch(flatItems, () => {
  if (activeIndex.value >= flatItems.value.length) activeIndex.value = 0
})

const runSearch = useDebounceFn(async (q: string) => {
  const term = q.trim()
  if (!term) {
    taskResults.value = []
    projectResults.value = []
    clientResults.value = []
    loading.value = false
    return
  }
  loading.value = true
  const like = `%${term}%`
  const isNum = /^\d+$/.test(term)

  try {
    const jobs: Promise<void>[] = []

    // Tasks
    jobs.push((async () => {
      let tq = supabase
        .from('tasks')
        .select('id,task_number,title,client:clients(company_name),project:projects(name)')
        .order('created_at', { ascending: false })
        .limit(6)
      tq = isNum
        ? tq.or(`title.ilike.${like},task_number.eq.${Number(term)}`)
        : tq.ilike('title', like)
      const { data } = await tq
      taskResults.value = (data ?? []).map((row: any) => ({
        id: 'task-' + row.id,
        label: row.title,
        sublabel: [formatTaskNumber(row.task_number), row.project?.name, row.client?.company_name]
          .filter(Boolean).join('  ·  '),
        icon: CheckSquare,
        to: `/tasks/${row.id}`
      }))
    })())

    // Projects
    jobs.push((async () => {
      const { data } = await supabase
        .from('projects')
        .select('id,name,client:clients(company_name)')
        .ilike('name', like)
        .limit(5)
      projectResults.value = (data ?? []).map((row: any) => ({
        id: 'project-' + row.id,
        label: row.name,
        sublabel: row.client?.company_name || undefined,
        icon: FolderOpen,
        to: `/projects/${row.id}`
      }))
    })())

    // Clients (only if the user can access the clients area)
    if (canAccessPage(role.value, '/clients')) {
      jobs.push((async () => {
        const { data } = await supabase
          .from('clients')
          .select('id,company_name,contact_person')
          .or(`company_name.ilike.${like},contact_person.ilike.${like}`)
          .limit(5)
        clientResults.value = (data ?? []).map((row: any) => ({
          id: 'client-' + row.id,
          label: row.company_name,
          sublabel: row.contact_person || undefined,
          icon: Building2,
          to: `/clients/${row.id}`
        }))
      })())
    } else {
      clientResults.value = []
    }

    await Promise.all(jobs)
  } finally {
    loading.value = false
    activeIndex.value = 0
  }
}, 250)

watch(query, (q) => {
  loading.value = !!q.trim()
  runSearch(q)
})

function move(delta: number) {
  const n = flatItems.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  nextTick(scrollActiveIntoView)
}

function scrollActiveIntoView() {
  const el = listEl.value?.querySelector(`[data-idx="${activeIndex.value}"]`)
  el?.scrollIntoView({ block: 'nearest' })
}

function selectActive() {
  const item = flatItems.value[activeIndex.value]
  if (item) run(item)
}

function run(item: Item) {
  close()
  navigateTo(item.to)
}

// Reset & focus each time it opens
watch(isOpen, (open) => {
  if (open) {
    query.value = ''
    taskResults.value = []
    projectResults.value = []
    clientResults.value = []
    activeIndex.value = 0
    nextTick(() => inputEl.value?.focus())
  }
})

// Global ⌘K / Ctrl+K shortcut
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
  }
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.kbd-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 10px;
}

.fade-fast-enter-active,
.fade-fast-leave-active { transition: opacity 0.18s ease; }
.fade-fast-enter-from,
.fade-fast-leave-to { opacity: 0; }

.scale-in-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.scale-in-leave-active { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
.scale-in-enter-from,
.scale-in-leave-to { opacity: 0; transform: scale(0.97) translateY(-8px); }
</style>
