const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

type ApiOptions = RequestInit & {
  headers?: Record<string, string>
}

type ApiResponse = {
  ok: boolean
  status: number
  body: any
}

const ACCESS_COOKIE_NAME = 's_user'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

export async function apiFetch(path: string, options: ApiOptions = {}, _retry = false): Promise<ApiResponse> {
  const token = getCookie(ACCESS_COOKIE_NAME)
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers, credentials: 'include' }))
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }

  // Since no refresh token, no auto refresh

  return { ok: res.ok, status: res.status, body: json }
}

export { setCookie, clearCookie, getCookie }

export default apiFetch

// Organization API functions
export async function getOrganizations(page: number = 0, size: number = 10) {
  const res = await apiFetch(`/organizations?page=${page}&size=${size}`)
  return res
}

export async function getPublicOrganizations(page: number = 0, size: number = 10) {
  const res = await apiFetch(`/organizations/public?page=${page}&size=${size}`)
  return res
}

export async function getPublicOrganization(id: string) {
  const res = await apiFetch(`/organizations/${id}/public`)
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

export async function getOrganizationMembers(id: string, page: number = 0, size: number = 10) {
  const res = await apiFetch(`/organizations/${id}/members?page=${page}&size=${size}`)
  return res
}

export async function checkOrganizationMembership(id: string) {
  const res = await apiFetch(`/organizations/${id}/is-member`)
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

export async function inviteUser(organizationId: string, userId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId })
  })
  return res
}

export async function searchUsers(query: string) {
  const res = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`)
  return res
}

// Space API functions
export async function getSpaces(organizationId: string, page: number = 0, size: number = 10) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  const res = await apiFetch(`/organizations/${organizationId}/spaces?${params}`)
  return res
}

export async function getSpace(organizationId: string, spaceId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/spaces/${spaceId}`)
  return res
}

export async function createSpace(organizationId: string, data: { name: string; description?: string; image?: string }) {
  const res = await apiFetch(`/organizations/${organizationId}/spaces`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function updateSpace(organizationId: string, spaceId: string, data: { name?: string; description?: string; image?: string }) {
  const res = await apiFetch(`/organizations/${organizationId}/spaces/${spaceId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res
}

export async function deleteSpace(organizationId: string, spaceId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/spaces/${spaceId}`, {
    method: 'DELETE'
  })
  return res
}

// News API functions
export async function getPublishedNews(page: number = 0, size: number = 10) {
  const res = await apiFetch(`/news?page=${page}&size=${size}`)
  return res
}

export async function getTrendingNews(page: number = 0, size: number = 10) {
  const res = await apiFetch(`/news/trending?page=${page}&size=${size}`)
  return res
}

export async function getNews(organizationId: string, page: number = 0, size: number = 10, status?: string) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  if (status && status !== 'all') params.append('status', status)
  const res = await apiFetch(`/organizations/${organizationId}/news?${params}`)
  return res
}

export async function getSpaceNews(organizationId: string, spaceId: string, page: number = 0, size: number = 10) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  return apiFetch(`/organizations/${organizationId}/spaces/${spaceId}/news?${params}`)
}

export async function getSingleNews(organizationId: string, newsId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/news/${newsId}`)
  return res
}

export async function createNews(organizationId: string, data: { space_id: string; title: string; content: string; image?: string; status?: string }) {
  const res = await apiFetch(`/organizations/${organizationId}/news`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function updateNews(organizationId: string, newsId: string, data: { space_id?: string; title?: string; content?: string; image?: string; status?: string }) {
  const res = await apiFetch(`/organizations/${organizationId}/news/${newsId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res
}

export async function deleteNews(organizationId: string, newsId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/news/${newsId}`, {
    method: 'DELETE'
  })
  return res
}

// Post API functions
export async function deletePost(postId: string) {
  const res = await apiFetch(`/posts/${postId}`, {
    method: 'DELETE'
  })
  return res
}

export async function reviewNews(organizationId: string, newsId: string, data: { action: string; review_notes?: string }) {
  const res = await apiFetch(`/organizations/${organizationId}/news/${newsId}/review`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

// Comments API functions (polymorphic)
export async function getComments(commentableType: string, commentableId: string, page: number = 0, size: number = 3, parentId?: string) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  if (parentId) params.append('parent_id', parentId)
  const res = await apiFetch(`/${commentableType}/${commentableId}/comments?${params}`)
  return res
}

export async function createComment(commentableType: string, commentableId: string, data: { content: string; parent_id?: string }) {
  const res = await apiFetch(`/${commentableType}/${commentableId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function uploadImage(formData: FormData) {
  const token = getCookie(ACCESS_COOKIE_NAME)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function logout() {
  const res = await apiFetch('/auth/logout', {
    method: 'POST'
  })
  return res
}

export async function refreshToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken })
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login-web`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function resetPassword(email: string, token: string, password: string, password_confirmation: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, password, password_confirmation })
  })
  let json = null
  try { json = await res.json() } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, body: json }
}

export async function pingWebSubHub(feedUrl: string) {
  const hubUrl = 'https://pubsubhubbub.appspot.com/';
  const res = await fetch(hubUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ 'hub.mode': 'publish', 'hub.url': feedUrl })
  });
  return res.ok;
}

// Donation Campaign API functions
export async function getDonationCampaigns(organizationId: string, page: number = 0, size: number = 10) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  const res = await apiFetch(`/organizations/${organizationId}/donations?${params}`)
  return res
}

export async function getDonationCampaign(organizationId: string, campaignId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}`)
  return res
}

export async function createDonationCampaign(organizationId: string, data: { title: string; description?: string; target_amount?: number; sticky?: boolean; end_date?: string; is_active?: boolean }) {
  const res = await apiFetch(`/organizations/${organizationId}/donations`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function updateDonationCampaign(organizationId: string, campaignId: string, data: { title?: string; description?: string; target_amount?: number; sticky?: boolean; end_date?: string; is_active?: boolean }) {
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return res
}

export async function deleteDonationCampaign(organizationId: string, campaignId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}`, {
    method: 'DELETE'
  })
  return res
}

export async function donateToCampaign(organizationId: string, campaignId: string, amount: number) {
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}/donate`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  })
  return res
}

export async function getStickyDonationCampaign(organizationId: string) {
  const res = await apiFetch(`/organizations/${organizationId}/donations/sticky`)
  return res
}

export async function getDonationTransactions(organizationId: string, campaignId: string, page: number = 0, size: number = 10) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}/transactions?${params}`)
  return res
}

export async function requestWithdrawal(organizationId: string, campaignId: string, data: { amount: number; bank_name: string; account_number: string; account_holder_name: string }) {
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}/request-withdrawal`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return res
}

export async function getWithdrawalRequests(organizationId: string, campaignId: string, page: number = 0, size: number = 10) {
  const params = new URLSearchParams({ page: page.toString(), size: size.toString() })
  const res = await apiFetch(`/organizations/${organizationId}/donations/${campaignId}/withdrawal-requests?${params}`)
  return res
}
