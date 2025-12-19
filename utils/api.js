const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export async function apiFetch(path, options = {}) {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }))
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export default apiFetch
