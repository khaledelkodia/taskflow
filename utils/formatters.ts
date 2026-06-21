import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'

// ─── Date / Time ──────────────────────────────────────────────────────
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMM d, yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMM d, yyyy · h:mm a')
  } catch {
    return '—'
  }
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  try {
    return isAfter(new Date(), parseISO(dueDate))
  } catch {
    return false
  }
}

// ─── Numbers ──────────────────────────────────────────────────────────
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return '—'
  return `${hours}h`
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function formatPercent(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

// ─── Task Number ──────────────────────────────────────────────────────
export function formatTaskNumber(n: number): string {
  return `TF-${String(n).padStart(4, '0')}`
}

// ─── String ───────────────────────────────────────────────────────────
export function truncate(str: string, maxLength = 60): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function slugToLabel(slug: string): string {
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Initials ─────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
