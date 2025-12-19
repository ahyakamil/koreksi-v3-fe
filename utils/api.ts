const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

type ApiOptions = RequestInit & {
  headers?: Record<string, string>
}

type ApiResponse = {
  ok: boolean
  status: number
  body: any
}

export async function apiFetch(path: string, options: ApiOptions = {}): Promise<ApiResponse> {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }))
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export default apiFetch

// Organization API functions
export async function getOrganizations() {
  const res = await apiFetch('/organizations')
  return res
}

export async function createOrganization(data: { title: string; description?: string; image?: string }) {
  const res = await apiFetch('/organizations', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function getOrganization(id: string) {
  const res = await apiFetch(`/organizations/${id}`)
  return res
}

export async function updateOrganization(id: string, data: { title?: string; description?: string; image?: string }) {
  const res = await apiFetch(`/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res
}

export async function deleteOrganization(id: string) {
  const res = await apiFetch(`/organizations/${id}`, {
    method: 'DELETE'
  })
  return res
}

export async function joinOrganization(id: string) {
  const res = await apiFetch(`/organizations/${id}/join`, {
    method: 'POST'
  })
  return res
}

export async function leaveOrganization(id: string) {
  const res = await apiFetch(`/organizations/${id}/leave`, {
    method: 'POST'
  })
  return res
}

export async function updateUserRole(organizationId: string, userId: string, role: string) {
  const res = await apiFetch(`/organizations/${organizationId}/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  })
  return res
}

export async function removeMember(organizationId: string, userId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/users/${userId}`, {
    method: 'DELETE'
  })
  return res
}

export async function uploadImage(formData: FormData) {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('accessToken') : null
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers,
    body: formData
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function logout(refreshToken: string) {
  const res = await apiFetch('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  })
  return res
}

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}
