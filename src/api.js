// Cliente de la API del backend (Spring Boot en Railway).
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(status, message, data, retryAfter) {
    super(message)
    this.status = status
    this.data = data
    this.retryAfter = retryAfter
  }
}

async function request(path, userId, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        ...(options.headers || {}),
      },
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que el backend esté en línea.')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const header = Number(res.headers.get('Retry-After'))
    const retryAfter = Number.isFinite(header) && header > 0 ? header : data?.details?.retryAfterSeconds
    throw new ApiError(res.status, data?.message || `Error ${res.status}`, data, retryAfter)
  }
  return data
}

export const api = {
  generate: (userId, prompt) =>
    request('/api/ai/generate', userId, { method: 'POST', body: JSON.stringify({ prompt }) }),
  status: (userId) => request('/api/quota/status', userId),
  history: (userId) => request('/api/quota/history', userId),
  upgrade: (userId, body) =>
    request('/api/quota/upgrade', userId, { method: 'POST', body: JSON.stringify(body) }),
}

export { API_URL }
