// Misma regla que el backend: ~1 token cada 4 caracteres.
export function estimateTokens(text) {
  const t = (text || '').trim()
  return t ? Math.ceil(t.length / 4) : 0
}

// Promedio de tokens de una respuesta del servicio simulado.
export const AVERAGE_COMPLETION_TOKENS = 30

export const PLANS = {
  FREE: { name: 'Free', rpm: 10, tokens: 50_000, price: 0 },
  PRO: { name: 'Pro', rpm: 60, tokens: 500_000, price: 20 },
  ENTERPRISE: { name: 'Enterprise', rpm: null, tokens: null, price: 99 },
}

const nf = new Intl.NumberFormat('es-CO')
export const fmt = (n) => nf.format(n)

export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function getOrCreateUserId() {
  try {
    const saved = localStorage.getItem('proxy-ia-user')
    if (saved) return saved
    const id = 'user-' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('proxy-ia-user', id)
    return id
  } catch {
    return 'demo-user'
  }
}

export function saveUserId(id) {
  try {
    localStorage.setItem('proxy-ia-user', id)
  } catch {
    /* sin almacenamiento disponible */
  }
}
