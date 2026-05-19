// ── helpers ────────────────────────────────────────────────────────────────

export function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysLeft(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp - today) / 86400000)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
  })
}

export function getBadge(days) {
  if (days < 0) return { cls: 'badge-expired', text: 'Utgången' }
  if (days === 0) return { cls: 'badge-urgent', text: 'Idag!' }
  if (days <= 2) return { cls: 'badge-urgent', text: `${days} dag${days === 1 ? '' : 'ar'}` }
  if (days <= 5) return { cls: 'badge-soon', text: `${days} dagar` }
  return { cls: 'badge-ok', text: `${days} dagar` }
}

export function locationLabel(loc) {
  return { fridge: 'Kyl', freezer: 'Frys', pantry: 'Skafferi' }[loc] || loc
}