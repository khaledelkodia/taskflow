import { defineStore } from 'pinia'
import type { Notification } from '~/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const supabase = useSupabaseClient()

  const notifications = ref<Notification[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length)

  async function fetchNotifications() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    loading.value = true
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      notifications.value = (data ?? []) as Notification[]
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    const n = notifications.value.find((n) => n.id === id)
    if (n) n.is_read = true
  }

  async function markAllAsRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authStore.user.id)
      .eq('is_read', false)
    notifications.value.forEach((n) => (n.is_read = true))
  }

  function addNotification(n: Notification) {
    notifications.value.unshift(n)
  }

  return {
    notifications, loading, unreadCount,
    fetchNotifications, markAsRead, markAllAsRead, addNotification
  }
})
